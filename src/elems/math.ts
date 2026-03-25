// math components

import { THEME } from '../lib/theme'
import { black, red } from '../lib/const'
import { is_array, is_scalar, is_string, is_boolean, is_object, check_singleton, ensure_singleton, check_array, check_string, ensure_vector, merge_limits, prefix_split, join_limits, sum, max } from '../lib/utils'
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

function remap_value(value: number, source: Limit, target: Limit): number {
    const [ s0, s1 ] = source
    const [ t0, t1 ] = target
    const span = s1 - s0
    if (span == 0) return 0.5 * (t0 + t1)
    const frac = (value - s0) / span
    return t0 + frac * (t1 - t0)
}

function remap_limit(bounds: Limit, source: Limit, target: Limit): Limit {
    const [ y0, y1 ] = bounds
    return [ remap_value(y0, source, target), remap_value(y1, source, target) ]
}

function inherit_metrics(source: WithMath | MathSpec, patch: Partial<InlineMetrics> = {}): MathSpec {
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

function vertical_padding(padding: Padding | undefined): Limit {
    if (padding == null) return [ 0, 0 ]
    if (is_scalar(padding)) return [ padding, padding ]
    if (!Array.isArray(padding)) return [ 0, 0 ]
    if (padding.length == 2) return [ padding[1], padding[1] ]
    const [ _pl, pt, _pr, pb ] = padding
    const [ pt1 ] = ensure_vector(pt, 2)
    const [ pb1 ] = ensure_vector(pb, 2)
    return [ pt1, pb1 ]
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

function inter_item_spacing(prev: WithMath | null, next: WithMath | null, spacing: number): number {
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
    size?: SpacingType
}

class MathSpacer extends Spacer {
    math: MathSpec

    constructor(args: MathSpacerArgs = {}) {
        const { advance: advance0 = 0, vrange = EMPTY_VRANGE, size, ...attr } = THEME(args, 'MathSpacer')

        // check aspect type
        const advance = size != null ? SPACING[size] : advance0
        if (!is_scalar(advance)) {
            throw new Error('must specify size (thin, medium, thick) or numerical aspect')
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
    anchor?: number
    target_vrange?: Limit
}

function layoutMathCol(items: WithMath[], { justify = 'center', spacing = 0, anchor: anchor0, target_vrange }: MathColLayout): InlineLayout {
    // empty case
    if (items.length == 0) return { children: [], aspect: 0, metrics: EMPTY_INLINE_METRICS }

    // find outer metrics
    const advance = max(items.map(item => item.math.advance)) ?? 0
    const bounds = items.map(item => metrics_bounds(item.math))

    // stack raw bounds top-down while preserving each child's anchor line
    let ybottom = 0
    const boxes = items.map((item, i) => {
        const [ ylo, yhi ] = bounds[i]
        const yanchor = ybottom + (i > 0 ? spacing : 0) - ylo
        const y0 = yanchor + ylo
        const y1 = yanchor + yhi
        ybottom = y1
        return { item, y0, y1 }
    })

    // optionally compress the stacked range into a new output range
    const source_vrange: Limit = [ 0, ybottom ]
    const vrange = target_vrange ?? source_vrange
    const anchor = anchor0 ?? (0.5 * ybottom)
    const vanchor = remap_value(anchor, source_vrange, vrange)

    // map children into full-width vertical slots
    const children = boxes.map(({ item, y0, y1 }) => {
        const [ y0c, y1c ] = remap_limit([ y0, y1 ], source_vrange, vrange)
        return with_math(item, {}, { rect: [ 0, y0c, advance, y1c ], align: justify })
    })

    // compute layout metrics
    const metrics: InlineMetrics = { advance, vrange, vanchor }
    const coord = join_limits({ h: [ 0, advance ], v: vrange })
    const aspect = metrics_aspect(metrics)

    // return layout
    return { children, coord, aspect, metrics }
}

interface MathColArgs extends GroupArgs {
    children?: WithMath[]
    spacing?: number
    anchor?: number
    target_vrange?: Limit
    justify?: Align
}

class MathCol extends Group {
    math: MathSpec

    constructor(args: MathColArgs = {}) {
        const { children: children0, justify, spacing = 0, anchor, target_vrange, ...attr } = THEME(args, 'MathCol')
        const items = ensure_children(children0)
        const mathItems = ensure_math_children(items)

        // compute layout
        const { metrics, ...layout } = layoutMathCol(mathItems, { justify, spacing, anchor, target_vrange })

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
    top?: number
    bottom?: number
    justify?: Align
    vanchor?: number
}

class MathBox extends Group {
    math: MathSpec

    constructor(args: MathBoxArgs = {}) {
        const { children: children0, advance: advance0, top = 0, bottom = 0, justify = 'center', vanchor: vanchor0, ...attr } = THEME(args, 'MathBox')
        const child0 = check_singleton(children0)
        const child = ensure_math(child0)

        // get metrics info
        const { left, right } = child.math
        const [ ylo, yhi ] = metrics_bounds(child.math)
        const height = top + (yhi - ylo) + bottom

        // compute layout metrics
        const advance = advance0 ?? child.math.advance
        const vrange: Limit = [ 0, height ]
        const vanchor = vanchor0 ?? (top - ylo)
        const metrics: InlineMetrics = { advance, vrange, vanchor }

        // make child item
        const rect: Rect = [ 0, top, advance, top + (yhi - ylo) ]
        const item = with_math(child, {}, { rect, align: justify })
        const coord: Rect = [ 0, 0, advance, height ]
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

interface MathScaleArgs extends GroupArgs {
    children?: WithMath[]
    scale?: number
    justify?: Align
}

class MathScale extends Group {
    math: MathSpec

    constructor(args: MathScaleArgs = {}) {
        const { children: children0, scale = 1, justify = 'left', ...attr } = THEME(args, 'MathScale')
        const child0 = check_singleton(children0)
        const child = ensure_math(child0)

        // compute scaled metrics
        const { advance, vrange: [ y0, y1 ], vanchor } = child.math
        const metrics: InlineMetrics = {
            advance: scale * advance,
            vrange: [ scale * y0, scale * y1 ],
            vanchor: scale * vanchor,
        }

        // make child item in the scaled coordinate frame
        const rect = metrics_rect(metrics)
        const item = with_math(child, {}, { rect, align: justify })
        const coord = rect
        const aspect = metrics_aspect(metrics)

        super({ children: [ item ], coord, aspect, ...attr })
        this.args = args
        this.math = inherit_metrics(child, metrics)
    }
}

//
// math text
//

interface MathTextArgs extends GroupArgs {
    spacing?: number
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

function layoutMathText(mathItems: WithMath[], spacing: number): MathTextLayout {
    const rowItems: WithMath[] = []

    // accumulate math metrics
    let left: MathClass = 'none'
    let right: MathClass = 'none'
    let prevItem: WithMath | null = null

    // process items
    for (const item of mathItems) {
        const { left: itemLeft, right: itemRight } = item.math

        // insert item with spacing
        const gap = inter_item_spacing(prevItem, item, spacing)
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
        const { children: children0, spacing = 0.25, ...attr } = THEME(args, 'MathText')
        const inputs = ensure_children(children0)
        const mathItems = normalize_math_children(inputs)

        // compress sapcing and layout
        const spacedItems = cancel_binary_atoms(mathItems)
        const { items, left, right } = layoutMathText(spacedItems, spacing)

        // pass to Group
        super({ children: items, ...attr })
        this.args = args

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
        const numer_box = new MathBox({ children: [ numer ], advance: width, bottom: pad_y })
        const axis = has_bar ? new MathRule({ advance: width, thickness: rule_size }) : new MathSpacer({ advance: width })
        const denom_box = new MathBox({ children: [ denom ], advance: width, top: pad_y })

        // pass to MathCol
        super({ children: [ numer_box, axis, denom_box ], ...attr })
        this.args = args
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
        const [ pad_top, pad_bottom ] = vertical_padding(padding)
        const bodyBox = new MathBox({ children: [ body ], top: pad_top, bottom: pad_bottom })
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
        const indexElem = index != null ? index.clone({ pos: [ 0.6 * gutter, 0.2 * bodyHeight ], yrad: 0.2 * bodyHeight, align: 'right' }) : null
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

function build_accent_symbol(label: string, color: string): Element {
    const label1 = ACCENT_LABEL_FALLBACK[label] ?? label
    if (label1 in ACCENT_TEXT_FALLBACK) {
        return new MathSpan({ children: [ ACCENT_TEXT_FALLBACK[label1] ], color })
    }
    return new MathSymbol({ children: [ label1 ], color })
}

interface AccentArgs extends GroupArgs {
    label?: string
    accent_height?: number
    body_top?: number
}

class Accent extends MathCol {
    constructor(args: AccentArgs = {}) {
        const { children, label = '', accent_height, body_top = 0.5, color, ...attr } = THEME(args, 'Accent')
        const child = check_singleton(children)
        const base = normalize_math_leaf(child)

        // check child
        if (base == null) {
            throw new Error('Accent must have exactly one child')
        }

        // build accent symbol
        const accent = ensure_math(build_accent_symbol(label, color))
        const width = Math.max(base.math.advance, accent.math.advance)
        const baseBox = new MathBox({ children: [ base ], advance: width })
        const accentHeight0 = metrics_height(accent.math)
        const accentPad = Math.max(0, (accent_height ?? accentHeight0) - accentHeight0)
        const accentBox = new MathBox({ children: [ accent ], advance: width, bottom: accentPad })
        const overlap = body_top * metrics_height(accentBox.math)

        // pass to MathCol, preserving the base anchor
        super({ children: [ accentBox, baseBox ], spacing: -overlap, ...attr })
        this.args = args

        // preserve the base atom classes
        this.math.left = base.math.left
        this.math.right = base.math.right
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
    size?: number
}

class Delim extends MathSymbol {
    constructor(args: DelimArgs = {}) {
        const { delim, side = 'left', mode = 'math', size = 3, vshift = -0.25, ...attr } = THEME(args, 'Delim')
        const text = get_delim_text(delim, side)
        const font_family = delimiter_font(size)
        const klass = side == 'left' ? 'mopen' : 'mclose'
        super({ children: [ text ], mode, klass, font_family, vshift, ...attr })
    }
}

function fit_delim_size(delim: string, side: 'left' | 'right', targetHeight: number, attr: Omit<DelimArgs, 'delim' | 'side' | 'size'>): number {
    for (let size = 1; size <= 5; size++) {
        const candidate = new Delim({ delim, side, size, ...attr })
        if (metrics_height(candidate.math) >= targetHeight) {
            return size
        }
    }
    return 5
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
        const { size: size0, ...delim_attr1 } = delim_attr as DelimArgs

        // check child
        if (body == null) {
            throw new Error('Bracket must have exactly one child')
        }

        // auto-detect delimiter size
        const targetHeight = metrics_height(body.math)
        const baseDelimAttr = { ...shared_attr, ...delim_attr1 }
        const leftSize = size0 ?? (left_delim != null ? fit_delim_size(left_delim, 'left', targetHeight, baseDelimAttr) : 1)
        const rightSize = size0 ?? (right_delim != null ? fit_delim_size(right_delim, 'right', targetHeight, baseDelimAttr) : 1)
        const left = left_delim != null ? new Delim({ delim: left_delim, side: 'left', size: leftSize, ...baseDelimAttr }) : null
        const right = right_delim != null ? new Delim({ delim: right_delim, side: 'right', size: rightSize, ...baseDelimAttr }) : null
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
            return new Sqrt({ children: [ body ], index })
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
