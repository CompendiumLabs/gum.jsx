// math components

import { THEME } from '../lib/theme'
import { black, red } from '../lib/const'
import { is_array, is_scalar, is_string, is_boolean, is_object, check_singleton, ensure_singleton, check_array, check_string, ensure_vector, merge_limits, prefix_split, join_limits, sum, max, rotate_aspect } from '../lib/utils'
import symbols from '../lib/symbols'
import { Element, Group, Spacer, spec_split, ensure_children } from './core'
import { CoordLine, RoundedRect } from './geometry'
import { Span } from './text'
import { __parse as parse_tex } from 'katex'
import { EMPTY_VRANGE, DEFAULT_VRANGE, type TextMetrics } from '../lib/text'

import type { Padding, Point, Rect, Limit, Align, Attrs } from '../lib/types'
import { VStack } from './layout'
import type { StackArgs } from './layout'
import type { SpanArgs } from './text'
import type { ElementArgs, GroupArgs } from './core'
import type { Measurement, SymbolMode, SymbolFamily, SymbolFont, SymbolEntry, Tree, TreeNode } from 'katex'

//
// types
//

type FontFamily = 'KaTeX_Math' | 'KaTeX_Main' | 'KaTeX_AMS' | 'KaTeX_Size1' | 'KaTeX_Size2' | 'KaTeX_Size3' | 'KaTeX_Size4'

type MathClass = 'mord' | 'mop' | 'mbin' | 'mrel' | 'mopen' | 'mclose' | 'mpunct' | 'minner' | 'none'

type MathSpec = {
    left: MathClass
    right: MathClass
    advance: number
    vrange: Limit
    vanchor: number
}

type InlineMetrics = Pick<MathSpec, 'advance' | 'vrange' | 'vanchor'>

type WithMath<E extends Element = Element> = E & {
    math: MathSpec
}

//
// fonts
//

const OP_SYMBOL_FONT: FontFamily = 'KaTeX_Size1'

const SYMBOL_MODE_FONT: Record<SymbolMode, FontFamily> = {
    math: 'KaTeX_Math',
    text: 'KaTeX_Main',
}

//
// constants
//

const MATH_AXIS = 0.25
const INLINE_SHIFT = -0.1

//
// symbols and spacing
//

const SYMBOL_FAMILY_CLASS: Record<SymbolFamily, MathClass> = {
    mathord: 'mord',
    textord: 'mord',
    bin: 'mbin',
    rel: 'mrel',
    open: 'mopen',
    close: 'mclose',
    punct: 'mpunct',
    inner: 'minner',
    'op-token': 'mop',
    'accent-token': 'mord',
    spacing: 'none',
}

const THINSPACE: Measurement = { number: 3, unit: 'mu' }
const MEDIUMSPACE: Measurement = { number: 4, unit: 'mu' }
const THICKSPACE: Measurement = { number: 5, unit: 'mu' }

type SpacingType = 'thin' | 'medium' | 'thick'
const SPACING: Record<SpacingType, number> = {
    thin: measurement_to_em(THINSPACE),
    medium: measurement_to_em(MEDIUMSPACE),
    thick: measurement_to_em(THICKSPACE),
}

type SpacingTable = Partial<Record<MathClass, Measurement>>
const SPACING_TABLE: Record<MathClass, SpacingTable> = {
    mord: { mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mop: { mord: THINSPACE, mop: THINSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mbin: { mord: MEDIUMSPACE, mop: MEDIUMSPACE, mopen: MEDIUMSPACE, minner: MEDIUMSPACE },
    mrel: { mord: THICKSPACE, mop: THICKSPACE, mopen: THICKSPACE, minner: THICKSPACE },
    mopen: {},
    mclose: { mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mpunct: { mord: THINSPACE, mop: THINSPACE, mrel: THICKSPACE, mopen: THINSPACE, mclose: THINSPACE, mpunct: THINSPACE, minner: THINSPACE },
    minner: { mord: THINSPACE, mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, mopen: THINSPACE, mpunct: THINSPACE, minner: THINSPACE },
    none: {},
}

//
// math metrics
//

const EMPTY_INLINE_METRICS: InlineMetrics = {
    advance: 0,
    vrange: EMPTY_VRANGE,
    vanchor: 0,
}

const DEFAULT_INLINE_METRICS: InlineMetrics = {
    advance: 1,
    vrange: DEFAULT_VRANGE,
    vanchor: MATH_AXIS,
}

function make_math({ left, right, advance, vrange, vanchor }: Partial<MathSpec>): MathSpec {
    return {
        left: left ?? 'mord',
        right: right ?? 'mord',
        advance: advance ?? EMPTY_INLINE_METRICS.advance,
        vrange: vrange ?? EMPTY_INLINE_METRICS.vrange,
        vanchor: vanchor ?? EMPTY_INLINE_METRICS.vanchor,
    }
}

function text_inline_metrics({ advance, vrange }: TextMetrics): InlineMetrics {
    return { advance, vrange, vanchor: MATH_AXIS }
}

function metrics_bounds({ vrange: [ ylo, yhi ], vanchor }: InlineMetrics): Limit {
    return [ ylo - vanchor, yhi - vanchor ]
}

function metrics_height({ vrange: [ ylo, yhi ] }: InlineMetrics): number {
    return yhi - ylo
}

function metrics_aspect(metrics: InlineMetrics): number | undefined {
    const { advance } = metrics
    const height = metrics_height(metrics)
    return height > 0 ? advance / height : undefined
}

function metrics_rect(metrics: InlineMetrics, x: number = 0, y: number = 0): Rect {
    const { advance } = metrics
    const [ ylo, yhi ] = metrics_bounds(metrics)
    return [ x, y + ylo, x + advance, y + yhi ]
}

function inherit_metrics(source: WithMath | MathSpec, patch: Partial<MathSpec> = {}): MathSpec {
    const math = (source as WithMath).math ?? source as MathSpec
    return make_math({ ...math, ...patch })
}

function with_math<E extends Element>(element: E, patch: Partial<MathSpec> = {}, args: Attrs = {}): WithMath<E> {
    const out = element.clone(args) as WithMath<E>
    const math = (element as WithMath<E>).math ?? make_math(ensure_metrics(element))
    out.math = make_math({ ...math, ...patch })
    return out
}

function ensure_metrics(element: Element): InlineMetrics {
    if (element instanceof Span) {
        return text_inline_metrics(element.metrics)
    } else {
        const { advance, vrange, vanchor } = DEFAULT_INLINE_METRICS
        return { advance: element.spec.aspect ?? advance, vrange, vanchor }
    }
}

function ensure_math<E extends Element>(element: E): WithMath<E> {
    if ((element as any).math != null) {
        return element as WithMath<E>
    }
    return with_math(element)
}

function span_metrics_aspect({ advance, vrange: [ ylo, yhi ] }: TextMetrics): number | undefined {
    const height = yhi - ylo
    return height > 0 ? advance / height : undefined
}

function span_metrics_coord({ vrange: [ ylo, yhi ] }: TextMetrics): Rect {
    return [ 0, ylo, 1, yhi ]
}

function with_text_metrics<E extends Span>(span: E, metrics: TextMetrics, args: Attrs = {}): E {
    const out = span.clone(args) as E
    const aspect = span_metrics_aspect(metrics)
    out.metrics = metrics
    out.spec.coord = span_metrics_coord(metrics)
    out.spec.aspect0 = aspect
    out.spec.aspect = out.spec.rotate_invar ? aspect : rotate_aspect(aspect, out.spec.rotate)
    return out
}

function ensure_math_children(children: Element[]): WithMath[] {
    return children.map(child => ensure_math(child))
}

function inline_padding(padding: Padding | undefined): Point {
    if (padding == null) return [ 0, 0 ]
    if (is_scalar(padding)) return [ padding, padding ]
    if (!Array.isArray(padding)) return [ 0, 0 ]
    if (padding.length == 2) return padding as Point
    const [ pl, _pt, pr, _pb ] = padding
    const [ pl1, pl2 ] = ensure_vector(pl, 2)
    const [ pr1, pr2 ] = ensure_vector(pr, 2)
    return [ 0.5 * (pl1 + pr1), 0.5 * (pl2 + pr2) ]
}

function padding_rect(padding: Padding | undefined): Rect {
    if (padding == null) return [ 0, 0, 0, 0 ]
    if (is_scalar(padding)) return [ padding, padding, padding, padding ]
    if (!Array.isArray(padding)) return [ 0, 0, 0, 0 ]
    if (padding.length == 2) {
        const [ px, py ] = padding
        return [ px, py, px, py ] as Rect
    }
    return padding as Rect
}

//
// symbol lookup
//

function get_symbol_entry(mode: SymbolMode, text: string): SymbolEntry | null {
    if (text in symbols[mode]) return symbols[mode][text]
    return null
}

function get_font_family(mode: SymbolMode, font: SymbolFont, family: SymbolFamily): FontFamily {
    return font == 'ams' ? 'KaTeX_AMS' :
           family == 'mathord' ? SYMBOL_MODE_FONT[mode] :
           'KaTeX_Main'
}

//
// measurement conversion
//

function measurement_to_em(d: Measurement): number {
    const scale: Record<string, number> = {
        mu: 1 / 18,
        em: 1,
        pt: 1 / 10,
        ex: 0.431,
    }
    return d.number * (scale[d.unit] ?? 0)
}

function inter_atom_spacing(prev: MathClass, next: MathClass): number {
    const table = SPACING_TABLE[prev]
    const measurement = table?.[next]
    if (measurement == null) return 0
    return measurement_to_em(measurement)
}

function inter_item_spacing(prev: WithMath | null, next: WithMath | null): number {
    if (prev == null || next == null) return 0
    const { right: prevRight } = prev.math
    const { left: nextLeft } = next.math
    return inter_atom_spacing(prevRight, nextLeft)
}

//
// binary atom cancellation
//

const BIN_LEFT_CANCELLER = new Set<MathClass>(['mbin', 'mopen', 'mrel', 'mop', 'mpunct'])
const BIN_RIGHT_CANCELLER = new Set<MathClass>(['mrel', 'mclose', 'mpunct'])

function cancel_element_left_bin(element: WithMath): WithMath {
    const { left, right } = element.math
    if (left != 'mbin') return element
    const right1 = right == 'mbin' ? 'mord' : right
    return with_math(element, { left: 'mord', right: right1 })
}

function cancel_element_right_bin(element: WithMath): WithMath {
    const { left, right } = element.math
    if (right != 'mbin') return element
    const left1 = left == 'mbin' ? 'mord' : left
    return with_math(element, { left: left1, right: 'mord' })
}

function cancel_binary_atoms(items0: WithMath[]): WithMath[] {
    const items = items0.slice()
    let prevIndex: number | null = null

    for (let i = 0; i < items.length; i++) {
        let item = items[i]
        const { left, right } = item.math
        if (left == 'none' && right == 'none') continue

        if (prevIndex == null) {
            item = cancel_element_left_bin(item)
            items[i] = item
        } else if (left != 'none') {
            const prev = items[prevIndex]
            const { right: prevRight } = prev.math

            if (prevRight == 'mbin' && BIN_RIGHT_CANCELLER.has(left)) {
                items[prevIndex] = cancel_element_right_bin(prev)
            }

            const { right: prevClass } = items[prevIndex].math
            if (left == 'mbin' && (prevClass == 'none' || BIN_LEFT_CANCELLER.has(prevClass))) {
                item = cancel_element_left_bin(item)
                items[i] = item
            }
        }

        prevIndex = i
    }

    if (prevIndex != null) {
        items[prevIndex] = cancel_element_right_bin(items[prevIndex])
    }

    return items
}

//
// math spacer
//

interface MathSpacerArgs extends ElementArgs {
    width?: SpacingType
}

class MathSpacer extends Spacer {
    math: MathSpec

    constructor(args: MathSpacerArgs = {}) {
        const { advance: advance0 = 0, vrange = EMPTY_VRANGE, width, ...attr } = THEME(args, 'MathSpacer')

        // check aspect type
        const advance = width != null ? SPACING[width] : advance0
        if (!is_scalar(advance)) {
            throw new Error('must specify width (thin, medium, thick) or numerical aspect')
        }

        // pass to Spacer
        super({ aspect: advance, ...attr })
        this.args = args

        // compute math metrics
        this.math = make_math({ advance, vrange, vanchor: 0 })
    }
}

//
// math span
//

interface MathSpanArgs extends SpanArgs {
    klass?: MathClass
    left?: MathClass
    right?: MathClass
}

class MathSpan extends Span {
    math: MathSpec

    constructor(args: MathSpanArgs = {}) {
        const { children, klass = 'mord', left = klass, right = left, vshift = -0.25, ...attr } = THEME(args, 'MathSpan')
        const text = check_string(children)

        // pass to Span
        super({ children: [ text ], vshift, ...attr })
        this.args = args

        // inherit math metrics
        this.math = make_math({ left, right, ...text_inline_metrics(this.metrics) })
    }
}

//
// math symbol
//

interface MathSymbolArgs extends MathSpanArgs {
    mode?: SymbolMode
}

class MathSymbol extends MathSpan {
    constructor(args: MathSymbolArgs = {}) {
        const { children: children0, mode = 'math', ...attr } = THEME(args, 'MathSymbol')
        const text = check_string(children0)

        // try to get symbol entry
        const { font, family, replace } = get_symbol_entry(mode, text) ??
            { font: 'main', family: 'mathord', replace: text }

        // font family and spacing class
        const children = [ replace ?? text ]
        const font_family = get_font_family(mode, font, family)
        const klass = SYMBOL_FAMILY_CLASS[family]

        // pass to MathSpan
        super({ children, font_family, klass, ...attr })
        this.args = args
    }
}

//
// math row
//

type InlineLayout = {
    children: Element[]
    metrics: InlineMetrics
    coord?: Rect
    aspect?: number
}

function layoutMathRow(items: WithMath[]): InlineLayout {
    // empty case
    if (items.length == 0) return { children: [], aspect: 0, metrics: EMPTY_INLINE_METRICS }

    // find outer vertical range
    const advance = sum(items.map(item => item.math.advance))
    const vrange = merge_limits(items.map(item => metrics_bounds(item.math)))

    // compute placements
    let xmax = 0
    const children = items.map(item => {
        const { advance: x } = item.math
        xmax += x
        return with_math(item, {}, { rect: metrics_rect(item.math, xmax - x, 0) })
    })

    // compute layout metrics
    const metrics: InlineMetrics = { advance, vrange, vanchor: 0 }
    const coord = join_limits({ h: [ 0, advance ], v: vrange })
    const aspect = metrics_aspect(metrics)

    // return layout
    return { children, coord, aspect, metrics }
}

interface MathRowArgs extends GroupArgs {
    children?: WithMath[]
}

class MathRow extends Group {
    math: MathSpec

    constructor(args: MathRowArgs = {}) {
        const { children: children0, ...attr } = THEME(args, 'MathRow')
        const items = ensure_children(children0)
        const mathItems = ensure_math_children(items)

        // compute layout
        const { metrics, ...layout } = layoutMathRow(mathItems)

        // pass to Group
        super({ ...layout, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord', ...metrics })
    }
}

//
// math col
//

type MathColLayout = {
    justify?: Align
    spacing?: number
}

function layoutMathCol(items: WithMath[], { justify = 'center', spacing = 0 }: MathColLayout): InlineLayout {
    // empty case
    if (items.length == 0) return { children: [], aspect: 0, metrics: EMPTY_INLINE_METRICS }

    // find outer advance
    const advance = max(items.map(item => item.math.advance)) ?? 0

    // stack top-down while preserving each child's anchor line
    let ybottom = 0
    const children = items.map((item, i) => {
        const [ ylo, yhi ] = metrics_bounds(item.math)
        const yanchor = ybottom + (i > 0 ? spacing : 0) - ylo
        const y0 = yanchor + ylo
        const y1 = yanchor + yhi
        ybottom = y1
        const rect: Rect = [ 0, y0, advance, y1 ]
        return with_math(item, {}, { rect, align: justify })
    })

    // compute layout metrics
    const vrange: Limit = [ 0, ybottom ]
    const metrics: InlineMetrics = { advance, vrange, vanchor: 0.5 * ybottom }
    const coord = join_limits({ h: [ 0, advance ], v: vrange })
    const aspect = metrics_aspect(metrics)

    // return layout
    return { children, coord, aspect, metrics }
}

interface MathColArgs extends GroupArgs {
    children?: WithMath[]
    spacing?: number
    justify?: Align
}

class MathCol extends Group {
    math: MathSpec

    constructor(args: MathColArgs = {}) {
        const { children: children0, justify, spacing = 0, ...attr } = THEME(args, 'MathCol')
        const items = ensure_children(children0)
        const mathItems = ensure_math_children(items)

        // compute layout
        const { metrics, ...layout } = layoutMathCol(mathItems, { justify, spacing })

        // pass to Group
        super({ ...layout, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord', ...metrics })
    }
}

//
// math box/rule
//

interface MathBoxArgs extends GroupArgs {
    children?: WithMath[]
    advance?: number
    padding?: Padding
    top?: number
    bottom?: number
    justify?: Align
    vanchor?: number
}

class MathBox extends Group {
    math: MathSpec

    constructor(args: MathBoxArgs = {}) {
        const { children: children0, advance: advance0, padding: padding0, justify = 'center', vanchor: vanchor0, ...attr } = THEME(args, 'MathBox')
        const child0 = check_singleton(children0)
        const child = ensure_math(child0)

        // get metrics info
        const [ ylo, yhi ] = metrics_bounds(child.math)
        const [ pl, pt, pr, pb ] = padding_rect(padding0)

        // compute layout metrics
        const inner_advance = advance0 ?? child.math.advance
        const outer_advance = inner_advance + pl + pr
        const outer_height = pt + (yhi - ylo) + pb
        const vrange: Limit = [ 0, outer_height ]
        const vanchor = vanchor0 ?? (pt - ylo)
        const metrics: InlineMetrics = { advance: outer_advance, vrange, vanchor }

        // make child item
        const rect: Rect = [ pl, pt, pl + inner_advance, pt + (yhi - ylo) ]
        const item = with_math(child, {}, { rect, align: justify })
        const coord: Rect = [ 0, 0, outer_advance, outer_height ]
        const aspect = metrics_aspect(metrics)

        super({ children: [ item ], coord, aspect, ...attr })
        this.args = args
        this.math = inherit_metrics(child, metrics)
    }
}

interface MathRuleArgs extends GroupArgs {
    advance?: number
    thickness?: number
    rounded?: number
    fill?: string
}

class MathRule extends Group {
    math: MathSpec

    constructor(args: MathRuleArgs = {}) {
        const { advance = 1, thickness = 0.033, rounded = 0.5, fill = black, ...attr } = THEME(args, 'MathRule')

        // make center bar
        const bar = thickness > 0 ? new RoundedRect({ rect: [ 0, 0, advance, thickness ], fill, rounded }) : null

        // compute layout metrics
        const metrics: InlineMetrics = { advance, vrange: [ 0, thickness ], vanchor: 0.5 * thickness }
        const coord: Rect = [ 0, 0, advance, thickness ]
        const aspect = metrics_aspect(metrics)

        // pass to Group
        super({ children: [ bar ], coord, aspect, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'none', right: 'none', ...metrics })
    }
}

//
// math text
//

interface MathTextArgs extends GroupArgs {
    spacing?: number
    inline?: boolean
}

type MathLeaf = Element | string | number | boolean | null | undefined

function normalize_math_leaf(child: MathLeaf): WithMath | undefined {
    if (child == null) {
        return
    } else if (child instanceof Element) {
        return ensure_math(child)
    } else if (is_scalar(child) || is_string(child) || is_boolean(child)) {
        const text = String(child)
        return new MathSymbol({ children: [ text ] })
    } else {
        throw new Error(`Unknown math leaf type: ${typeof child}`)
    }
}

function normalize_math_children(children0: Element | Element[]): WithMath[] {
    const children = is_array(children0) ? children0 : [ children0 ]
    const out: WithMath[] = []

    for (const child of children) {
        if (child == null) {
            continue
        } else if (is_array(child)) {
            out.push(...normalize_math_children(child))
            continue
        } else if (child instanceof MathText) {
            out.push(...child.items)
        } else {
            const elem = normalize_math_leaf(child)
            if (elem == null) continue
            out.push(elem)
        }
    }

    return out
}

type MathTextLayout = {
    items: WithMath[]
    left: MathClass
    right: MathClass
}

function layoutMathText(mathItems: WithMath[]): MathTextLayout {
    const rowItems: WithMath[] = []

    // accumulate math metrics
    let left: MathClass = 'none'
    let right: MathClass = 'none'
    let prevItem: WithMath | null = null

    // process items
    for (const item of mathItems) {
        const { left: itemLeft, right: itemRight } = item.math

        // insert item with spacing
        const gap = inter_item_spacing(prevItem, item)
        if (gap > 0) rowItems.push(new MathSpacer({ advance: gap }))
        rowItems.push(item)

        // update left/right classes
        if (left == 'none') left = itemLeft
        if (itemRight != 'none') right = itemRight
        prevItem = item
    }

    // set default right
    if (right == 'none') right = left

    // return math items
    return { items: rowItems, left, right }
}

class MathText extends MathRow {
    items: WithMath[]

    constructor(args: MathTextArgs = {}) {
        const { children: children0, inline, ...attr } = THEME(args, 'MathText')
        const inputs = ensure_children(children0)
        const mathItems = normalize_math_children(inputs)

        // compress sapcing and layout
        const spacedItems = cancel_binary_atoms(mathItems)
        const { items, left, right } = layoutMathText(spacedItems)

        // pass to Group
        super({ children: items, ...attr })
        this.args = args

        // HACK: shift coord for inline text alignment
        if (inline && this.spec.coord != null) {
            const [x1, y1, x2, y2] = this.spec.coord as Rect
            const shift = INLINE_SHIFT * (y2 - y1)
            this.spec.coord = [x1, y1 + shift, x2, y2 + shift]
        }

        // set math metrics
        this.items = mathItems
        this.math.left = left
        this.math.right = right
    }
}

//
// sup/sub
//

interface SupSubArgs extends StackArgs {
    sup?: MathLeaf
    sub?: MathLeaf
}

class SupSub extends MathRow {
    constructor(args: SupSubArgs = {}) {
        const { children, sup: sup0, sub: sub0, hspacing = 0.025, vspacing = 0.05, ...attr } = THEME(args, 'SupSub')
        const child = ensure_singleton(children)
        const base = normalize_math_leaf(child)

        // check child
        if (base == null) {
            throw new Error('SupSub must have exactly one child')
        }

        // handle missing scripts
        const sup = normalize_math_leaf(sup0) ?? new MathSpacer()
        const sub = normalize_math_leaf(sub0) ?? new MathSpacer()

        // layout script side
        const scripts = new VStack({
            children: [ sup, sub ], justify: 'left', spacing: vspacing, even: true
        })

        // set metrics on side
        const advance = scripts.spec.aspect ?? 0
        const side = with_math(scripts, inherit_metrics(base, { advance }))

        // construct full row
        const spacer = new MathSpacer({ advance: hspacing })
        const items = side != null ? [ base, spacer, side ] : [ base ]

        // pass to MathRow
        super({ children: items, ...attr })
        this.args = args

        // preserve the base atom classes while keeping the actual row metrics
        this.math.left = base.math.left
        this.math.right = base.math.right
    }
}

//
// frac
//

interface FracArgs extends GroupArgs {
    numer?: Element
    denom?: Element
    has_bar?: boolean
    left?: Element | null
    right?: Element | null
    padding?: Padding
    rule_size?: number
}

class Frac extends MathCol {
    constructor(args: FracArgs = {}) {
        const { children: children0, has_bar = true, padding = 0.1, rule_size = 0.033, ...attr } = THEME(args, 'Frac')
        const [ numer0, denom0 ] = check_array(children0, 2)
        const [ pad_x, pad_y ] = inline_padding(padding)
        const numer = normalize_math_leaf(numer0)
        const denom = normalize_math_leaf(denom0)

        // check children
        if (numer == null || denom == null) {
            throw new Error('Frac must have exactly two children')
        }

        // get math metrics
        const numMetrics = numer.math
        const denMetrics = denom.math

        // compute parameters
        const width = Math.max(numMetrics.advance, denMetrics.advance) + 2 * pad_x
        const numer_pad = new MathSpacer({ vrange: [ 0, pad_y ] })
        const axis = has_bar ? new MathRule({ advance: width, thickness: rule_size }) : new MathSpacer({ advance: width })
        const denom_pad = new MathSpacer({ vrange: [ 0, pad_y ] })

        // pass to MathCol
        super({ children: [ numer, numer_pad, axis, denom_pad, denom ], ...attr })
        this.args = args

        // use the bar position as the inline anchor
        const vanchor = metrics_height(numer.math) + metrics_height(numer_pad.math) + axis.math.vanchor
        this.math = inherit_metrics(this.math, { vanchor })
    }
}

//
// sqrt
//

interface SqrtArgs extends GroupArgs {
    index?: Element | null
    padding?: Padding
}

class Sqrt extends Group {
    math: MathSpec

    constructor(args: SqrtArgs = {}) {
        const { children, index = null, color, padding = [0, 0.1, 0.1, 0.1], line_width = 0.05, ...attr } = THEME(args, 'Sqrt')
        const child = check_singleton(children)
        const body = normalize_math_leaf(child)

        // check child
        if (body == null) {
            throw new Error('Sqrt must have exactly one child')
        }

        // build math-aware body box
        const bodyBox = new MathBox({ children: [ body ], padding })
        const bodyHeight = metrics_height(bodyBox.math)
        const bodyWidth = bodyBox.math.advance

        // compute layout metrics
        const gutter = 0.5 * bodyHeight
        const width = gutter + bodyWidth
        const body_rect: Rect = [ gutter, 0, width, bodyHeight ]
        const coord: Rect = [ 0, 0, width, bodyHeight ]

        // build radical around the boxed body
        const radical = new CoordLine({
            points: [
                [ 0, 0.6 * bodyHeight ],
                [ 0.1 * gutter, 0.5 * bodyHeight ],
                [ 0.42 * gutter, 0.9 * bodyHeight ],
                [ gutter, 0 ],
                [ width, 0 ],
            ],
            coord,
            line_width,
            stroke: color,
            stroke_linecap: 'round',
            stroke_linejoin: 'round',
        })

        // build optional index element
        const indexElem = index != null ? index.clone({ pos: [ 0.6 * gutter, 0.2 * bodyHeight ], ysize: 0.4 * bodyHeight, align: 'right' }) : null
        const bodyElem = with_math(bodyBox, {}, { rect: body_rect })

        // compute composite metrics by preserving the body anchor
        const metrics: InlineMetrics = {
            advance: width,
            vrange: [ 0, bodyHeight ],
            vanchor: bodyBox.math.vanchor,
        }
        const aspect = metrics_aspect(metrics)

        // pass to Group
        super({ children: [ bodyElem, indexElem, radical ], coord, aspect, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord', ...metrics })
    }
}

//
// accent
//

const ACCENT_LABEL_FALLBACK: Record<string, string> = {
    '\\widehat': '\\hat',
    '\\widecheck': '\\check',
    '\\widetilde': '\\tilde',
    '\\utilde': '\\tilde',
}

const ACCENT_TEXT_FALLBACK: Record<string, string> = {
    '\\vec': '→',
}

function build_accent_symbol(label: string, color: string | undefined): WithMath {
    const span_attr = color != null ? { color } : {}
    const label1 = ACCENT_LABEL_FALLBACK[label] ?? label
    if (label1 in ACCENT_TEXT_FALLBACK) {
        return new MathSpan({ children: [ ACCENT_TEXT_FALLBACK[label1] ], ...span_attr })
    }
    return new MathSymbol({ children: [ label1 ], ...span_attr })
}

interface AccentArgs extends GroupArgs {
    label?: string
    color?: string
}

class Accent extends Group {
    math: MathSpec

    constructor(args: AccentArgs = {}) {
        const { children, label = '', color, ...attr } = THEME(args, 'Accent')
        const child = check_singleton(children)
        const base = normalize_math_leaf(child)

        // check child
        if (base == null) {
            throw new Error('Accent must have exactly one child')
        }

        // build overlay children
        const accent = build_accent_symbol(label, color)
        const advance = max([ base.math.advance, accent.math.advance ]) ?? 0
        const xbase = 0.5 * (advance - base.math.advance)
        const xaccent = 0.5 * (advance - accent.math.advance)

        // place children explicitly in a shared inline box
        const accentElem = with_math(accent, {}, { rect: metrics_rect(accent.math, xaccent, 0) })
        const baseElem = with_math(base, {}, { rect: metrics_rect(base.math, xbase, 0) })

        // outer metrics are the union of the overlaid children
        const accentBounds = metrics_bounds(accent.math)
        const baseBounds = metrics_bounds(base.math)
        const [ ylo, yhi ] = merge_limits([ accentBounds, baseBounds ])
        const height = yhi - ylo
        const coord: Rect = [ 0, ylo, advance, yhi ]
        const metrics: InlineMetrics = { advance, vrange: [ 0, height ], vanchor: -ylo }
        const aspect = metrics_aspect(metrics)

        super({ children: [ accentElem, baseElem ], coord, aspect, ...attr })
        this.args = args
        this.math = make_math({ left: base.math.left, right: base.math.right, ...metrics })
    }
}

//
// bracket
//

type DelimType = 'round' | 'square' | 'curly' | 'angle'

function normalize_delim(delim: string | null | undefined): string | null {
    if (delim == null || delim == '.' || delim == '') return null
    return delim
}

function delimiter_font(size: number): FontFamily {
    if (size >= 5) return 'KaTeX_Size4'
    if (size == 4) return 'KaTeX_Size3'
    if (size == 3) return 'KaTeX_Size2'
    if (size == 2) return 'KaTeX_Size1'
    return 'KaTeX_Main'
}

function get_delim_text(delim: string | undefined, side: 'left' | 'right'): string {
    if (delim == '.' || delim == null) return ''
    if (side == 'left') {
        return delim == 'round' ? '(' :
               delim == 'square' ? '[' :
               delim == 'curly' ? '{' :
               delim == 'angle' ? '<' :
               delim ?? ''
    } else {
        return delim == 'round' ? ')' :
               delim == 'square' ? ']' :
               delim == 'curly' ? '}' :
               delim == 'angle' ? '>' :
               delim ?? ''
    }
}

interface DelimArgs extends MathSymbolArgs {
    delim?: string
    side?: 'left' | 'right'
    mode?: SymbolMode
    level?: number
}

class Delim extends MathSymbol {
    constructor(args: DelimArgs = {}) {
        const { delim, side = 'left', mode = 'math', level = 3, vshift = -0.25, ...attr } = THEME(args, 'Delim')
        const text = get_delim_text(delim, side)
        const font_family = delimiter_font(level)
        const klass = side == 'left' ? 'mopen' : 'mclose'
        super({ children: [ text ], mode, klass, font_family, vshift, ...attr })
    }
}

function fit_delim_size(delim: string, side: 'left' | 'right', targetHeight: number, attr: Omit<DelimArgs, 'delim' | 'side' | 'level'>): number {
    let bestSize = 1
    let bestError = Infinity

    for (let level = 1; level <= 5; level++) {
        const candidate = new Delim({ delim, side, level, ...attr })
        const height = metrics_height(candidate.math)
        const error = Math.abs(Math.log((targetHeight || 1) / (height || 1)))
        if (error < bestError) {
            bestError = error
            bestSize = level
        }
    }

    return bestSize
}

function fit_text_metrics(source: TextMetrics, target: InlineMetrics): TextMetrics {
    const [ sourceLo, sourceHi ] = source.vrange
    const [ rawLo, rawHi ] = source.raw_vrange ?? source.vrange
    const targetHeight = metrics_height(target)
    const sourceHeight = sourceHi - sourceLo
    const scale = sourceHeight > 0 ? targetHeight / sourceHeight : 1
    const shift = target.vrange[0] - scale * sourceLo

    return {
        advance: source.advance * scale,
        vrange: target.vrange,
        raw_vrange: [ shift + scale * rawLo, shift + scale * rawHi ],
    }
}

function fit_delim(delim: Delim, target: InlineMetrics): WithMath<Delim> {
    const metrics = fit_text_metrics(delim.metrics, target)
    const out = with_text_metrics(delim, metrics) as WithMath<Delim>
    out.math = inherit_metrics(delim, {
        advance: metrics.advance,
        vrange: target.vrange,
        vanchor: target.vanchor,
    })
    return out
}

interface BracketArgs extends StackArgs {
    delim?: DelimType | [ DelimType, DelimType ]
    left_delim?: string | null
    right_delim?: string | null
}

class Bracket extends MathRow {
    constructor(args: BracketArgs = {}) {
        const { children: children0, delim: delim0 = 'round', left_delim: leftDelim0, right_delim: rightDelim0, ...attr0 } = THEME(args, 'Bracket')
        const body0 = check_singleton(children0)
        const body = normalize_math_leaf(body0)
        const [ left_delim1, right_delim1 ] = ensure_vector(delim0, 2)
        const left_delim = normalize_delim(leftDelim0 ?? left_delim1)
        const right_delim = normalize_delim(rightDelim0 ?? right_delim1)
        const [ spec, shared_attr0 ] = spec_split(attr0)
        const [ delim_attr, shared_attr ] = prefix_split([ 'delim' ], shared_attr0)
        const { level: level0, ...delim_attr1 } = delim_attr as DelimArgs

        // check child
        if (body == null) {
            throw new Error('Bracket must have exactly one child')
        }

        // auto-detect delimiter size
        const targetHeight = metrics_height(body.math)
        const baseDelimAttr = { ...shared_attr, ...delim_attr1 }
        const leftSize = level0 ?? (left_delim != null ? fit_delim_size(left_delim, 'left', targetHeight, baseDelimAttr) : 1)
        const rightSize = level0 ?? (right_delim != null ? fit_delim_size(right_delim, 'right', targetHeight, baseDelimAttr) : 1)
        const left0 = left_delim != null ? new Delim({ delim: left_delim, side: 'left', level: leftSize, ...baseDelimAttr }) : null
        const right0 = right_delim != null ? new Delim({ delim: right_delim, side: 'right', level: rightSize, ...baseDelimAttr }) : null
        const left = left0 != null ? fit_delim(left0, body.math) : null
        const right = right0 != null ? fit_delim(right0, body.math) : null
        const items = [ left, body, right ].filter(item => item != null)

        // pass to MathRow
        super({ children: items, ...shared_attr, ...spec })
        this.args = args

        // grouped delimiters behave like an ordinary atom
        this.math.left = 'mord'
        this.math.right = 'mord'
    }
}

//
// parse katex tree
//

const EMPTY_MATH = new MathSpacer()

function convert_tree(tree: Tree | TreeNode | null, attr: Attrs = {}): WithMath {
    if (tree == null) return EMPTY_MATH

    if (is_array(tree)) {
        const row = new MathText({ children: tree.map(node => convert_tree(node, attr)) })
        return row.children.length > 0 ? row : EMPTY_MATH
    }

    if (is_object(tree)) {
        const { type } = tree

        if (type == 'mathord') {
            const { mode, text } = tree
            return new MathSymbol({ children: [ text ], mode, ...attr })
        } else if (type == 'textord') {
            const { mode, text } = tree
            return new MathSymbol({ children: [ text ], mode, ...attr })
        } else if (type == 'atom') {
            const { mode, text, family } = tree
            return new MathSymbol({ children: [ text ], mode, family, ...attr })
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body, attr)
        } else if (type == 'op') {
            const { mode, name } = tree
            const entry = get_symbol_entry(mode, name)
            if (entry != null) {
                return new MathSymbol({ children: [ name ], mode, klass: 'mop', font_family: OP_SYMBOL_FONT, ...attr })
            } else {
                const name1 = name.slice(1)
                return new MathSymbol({ children: [ name1 ], mode: 'text', klass: 'mop', ...attr })
            }
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body, attr)
        } else if (type == 'accent') {
            const { label, base: base0 } = tree
            const base = convert_tree(base0, attr)
            return new Accent({ children: [ base ], label, ...attr })
        } else if (type == 'kern') {
            const { dimension } = tree
            const em = measurement_to_em(dimension)
            return new MathSpacer({ advance: em })
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const base = convert_tree(base0, attr)
            const sup = sup0 ? convert_tree(sup0, attr) : null
            const sub = sub0 ? convert_tree(sub0, attr) : null
            return new SupSub({ children: [ base ], sup, sub, ...attr })
        } else if (type == 'genfrac') {
            const { mode = 'math', numer: numer0, denom: denom0, hasBarLine = true, leftDelim, rightDelim } = tree
            const numer = convert_tree(numer0, attr)
            const denom = convert_tree(denom0, attr)
            const frac = new Frac({ children: [ numer, denom ], has_bar: hasBarLine, ...attr })
            if (leftDelim != null || rightDelim != null) {
                return new Bracket({ children: [ frac ], left_delim: leftDelim, right_delim: rightDelim, mode, ...attr })
            }
            return frac
        } else if (type == 'sqrt') {
            const { body: body0, index: index0 } = tree
            const body = convert_tree(body0, attr)
            const index = index0 ? convert_tree(index0, attr) : null
            return new Sqrt({ children: [ body ], index, ...attr })
        } else if (type == 'leftright') {
            const { mode, body: body0, left, right } = tree
            const body = convert_tree(body0, attr)
            return new Bracket({ children: [ body ], left_delim: left, right_delim: right, mode, ...attr })
        }
    }

    // fallback
    console.error('Unknown katex tree type:', tree)
    return EMPTY_MATH
}

//
// katex parser and component
//

class Latex extends MathText {
    constructor(args: ElementArgs = {}) {
        const { children, inline, ...attr0 } = THEME(args, 'Latex')
        const tex = check_string(children)
        const [ spec, attr ] = spec_split(attr0)

        // parse to AST
        const elems: WithMath[] = []
        try {
            const tree = parse_tex(tex)
            const items = tree.map(tree => convert_tree(tree, attr))
            elems.push(...items)
        } catch (e) {
            const error = new MathSpan({ children: [ tex ], color: red })
            elems.push(error)
        }

        // pass to MathText
        super({ children: elems, inline, ...spec })
        this.args = args
    }
}

class Tex extends Latex {
    constructor({ inline = true, ...args }: ElementArgs = {}) {
        super({ inline, ...args })
    }
}

//
// exports
//

export { MathSpan, MathSymbol, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathText, SupSub, Frac, Sqrt, Accent, Bracket, Latex, Tex }
export type { MathClass, MathSpec, InlineMetrics, FontFamily, MathSymbolArgs, MathTextArgs }
