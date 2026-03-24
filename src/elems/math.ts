// math components

import { THEME } from '../lib/theme'
import { black, red, DEFAULTS as D } from '../lib/const'
import { is_array, is_scalar, is_string, is_boolean, is_object, check_singleton, ensure_singleton, check_array, check_string, ensure_vector, merge_rects, prefix_split } from '../lib/utils'
import symbols from '../lib/symbols'
import { Element, Group, Rectangle, Spacer, spec_split, ensure_children } from './core'
import { CoordLine } from './geometry'
import { HStack, VStack, Box } from './layout'
import { Span } from './text'
import { __parse as parse_tex } from 'katex'
import { EMPTY_METRIC, DEFAULT_VRANGE, type TextMetrics } from '../lib/text'

import type { Padding, Point, Rect, Attrs } from '../lib/types'
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
    metrics: TextMetrics
}

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
const MATH_AXIS = 0.25

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

function make_math({ left, right, metrics }: Partial<MathSpec>): MathSpec {
    return {
        left: left ?? 'mord',
        right: right ?? 'mord',
        metrics: metrics ?? EMPTY_METRIC,
    }
}

//
// inline layout
//

type InlinePlacement = {
    item: Element
    rect: Rect
}

type InlineLayout = {
    children: Element[]
    metrics: TextMetrics
    coord?: Rect
    aspect?: number
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

function inline_aspect({ advance, vrange: [ ymin, ymax ] }: TextMetrics): number | undefined {
    const height = ymax - ymin
    return height > 0 ? advance / height : undefined
}

function inline_rect({ advance, vrange: [ ymin, ymax ] }: TextMetrics, x: number = 0, y: number = 0): Rect {
    return [ x, y - ymax, x + advance, y - ymin ]
}

function layout_inline_placements(items: InlinePlacement[]): InlineLayout {
    // empty case
    if (items.length == 0) {
        return { children: [], metrics: EMPTY_METRIC }
    }

    // reposition children
    const [ xmin, ymin, xmax, ymax ] = merge_rects(items.map(item => item.rect)) ?? D.rect
    const children = items.map(({ item, rect: [ x1, y1, x2, y2 ] }) =>
        item.clone({ rect: [ x1 - xmin, y1, x2 - xmin, y2 ] })
    )

    // compute layout metrics
    const metrics: TextMetrics = { advance: xmax - xmin, vrange: [ -ymax, -ymin ] }
    const coord: Rect = [ 0, ymin, metrics.advance, ymax ]
    const aspect = inline_aspect(metrics)

    // return layout
    return { children, coord, metrics, aspect }
}

function layout_inline_row(items: WithMath[]): InlineLayout {
    const placements: InlinePlacement[] = []
    let x = 0

    for (const item of items) {
        const { metrics } = item.math
        if (metrics == null) continue
        placements.push({ item, rect: inline_rect(metrics, x) })
        x += metrics.advance
    }

    return layout_inline_placements(placements)
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
    const math = { ...element.math, left: 'mord', right: right1 }
    return element.clone({ math }) as WithMath<typeof element>
}

function cancel_element_right_bin(element: WithMath): WithMath {
    const { left, right } = element.math
    if (right != 'mbin') return element
    const left1 = left == 'mbin' ? 'mord' : left
    const math = { ...element.math, left: left1, right: 'mord' }
    return element.clone({ math }) as WithMath<typeof element>
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

type MathSpacerArgs = ElementArgs & {
    aspect?: number
}

class MathSpacer extends Spacer {
    math: MathSpec

    constructor(args: MathSpacerArgs = {}) {
        const { aspect = 0, ...attr } = THEME(args, 'MathSpacer')
        super({ aspect, ...attr })
        this.args = args

        // compute math metrics
        const metrics: TextMetrics = { advance: aspect, vrange: [ 0, 0 ] }
        this.math = make_math({ metrics })
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
        this.math = make_math({ left, right, metrics: this.metrics })
    }
}

interface MathSymbolArgs extends MathSpanArgs {
    mode?: SymbolMode
}

//
// math symbol
//

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
// math text
//

interface MathTextArgs extends GroupArgs {
    spacing?: number
}

type MathLeaf = Element | string | number | boolean | null

function ensure_metrics(element: Element): TextMetrics {
    if (element instanceof Span) {
        return element.metrics
    } else {
        const advance = element.spec.aspect ?? 1
        return { advance, vrange: DEFAULT_VRANGE }
    }
}

function ensure_math<E extends Element>(element: E): WithMath<E> {
    if ((element as any).math != null) {
        return element as WithMath<E>
    }
    const metrics = ensure_metrics(element)
    const math = make_math({ metrics })
    const newElement = element.clone() as WithMath<E>
    newElement.math = math
    return newElement
}

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

class MathText extends Group {
    math: MathSpec
    items: WithMath[]

    constructor(args: MathTextArgs = {}) {
        const { children: children0, spacing = 0.25, ...attr } = THEME(args, 'MathText')
        const inputs = ensure_children(children0)

        // normalize children
        const items = normalize_math_children(inputs)
        const rowMathItems = cancel_binary_atoms(items)
        const rowItems: WithMath[] = []

        // accumulate math metrics
        let left: MathClass = 'none'
        let right: MathClass = 'none'
        let prevItem: WithMath | null = null

        // process items
        for (const item of rowMathItems) {
            const { left: itemLeft, right: itemRight } = item.math
            const gap = inter_item_spacing(prevItem, item, spacing)
            console.log('inter_item_spacing', prevItem, item, gap)
            if (gap > 0) rowItems.push(new MathSpacer({ aspect: gap }))

            rowItems.push(item)

            if (left == 'none') left = itemLeft
            if (itemRight != 'none') {
                right = itemRight
            }
            prevItem = item
        }

        // set default right
        if (right == 'none') right = left

        // compute inline row layout
        const { children, coord, metrics, aspect } = layout_inline_row(rowItems)
        const math = make_math({ left, right, metrics })

        // pass to Group
        super({ children, coord, aspect, math, ...attr })
        this.args = args

        // set math metrics
        this.math = math
        this.items = items
    }
}

//
// sup/sub
//

interface SupSubArgs extends StackArgs {
    sup?: MathLeaf
    sub?: MathLeaf
}

class SupSub extends HStack {
    math: MathSpec

    constructor(args: SupSubArgs = {}) {
        const { children, sup: sup0 = null, sub: sub0 = null, hspacing = 0.025, vspacing = -0.025, voffset = 0.025, ...attr } = THEME(args, 'SupSub')
        const child = ensure_singleton(children)
        const base = normalize_math_leaf(child)

        // check child
        if (base == null) {
            throw new Error('SupSub must have exactly one child')
        }

        // ensure math metrics
        const sup = normalize_math_leaf(sup0)
        const sub = normalize_math_leaf(sub0)

        // handle missing sup/sub
        const supElem = sup != null ? sup : new Spacer()
        const subElem = sub != null ? sub : new Spacer()

        // make side stack
        const side = new VStack({
            children: [ supElem, subElem ],
            even: true, spacing: vspacing,
            justify: 'left', pos: [ 0.5, 0.5 + voffset ]
        })
        const sideBox = new Box({ children: [ side ] })

        // pass to HStack
        super({ children: [ base, sideBox ], spacing: hspacing, ...attr })
        this.args = args

        // set math metrics
        const { left, right, metrics } = base.math
        const { vrange } = metrics
        const metrics1 = { advance: this.spec.aspect ?? 0, vrange }
        this.math = { left, right, metrics: metrics1 }
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

class Frac extends Group {
    math: MathSpec

    constructor(args: FracArgs = {}) {
        const { children: children0, has_bar = true, padding = 0.1, rule_size = 0.03, ...attr } = THEME(args, 'Frac')
        const [ numer0, denom0 ] = check_array(children0, 2)
        const [ pad_x, pad_y ] = inline_padding(padding)
        const numer = normalize_math_leaf(numer0)
        const denom = normalize_math_leaf(denom0)

        // check children
        if (numer == null || denom == null) {
            throw new Error('Frac must have exactly two children')
        }

        // get math metrics
        const { metrics: numMetrics } = numer.math
        const { metrics: denMetrics } = denom.math

        // compute parameters
        const width = Math.max(numMetrics.advance, denMetrics.advance) + 2 * pad_x
        const bar_half = has_bar ? 0.5 * rule_size : 0
        const clearance = pad_y
        const axis_y = -MATH_AXIS
        const numer_shift = -numMetrics.vrange[0] + clearance + bar_half
        const denom_shift = denMetrics.vrange[1] + clearance + bar_half
        const numer_x = 0.5 * (width - numMetrics.advance)
        const denom_x = 0.5 * (width - denMetrics.advance)
        const numer_base = axis_y - numer_shift
        const denom_base = axis_y + denom_shift

        // compute placements
        const placements: InlinePlacement[] = [
            {
                item: numer,
                rect: inline_rect(numMetrics, numer_x, numer_base),
            },
            {
                item: denom,
                rect: inline_rect(denMetrics, denom_x, denom_base),
            },
        ]
        if (has_bar) {
            placements.push({
                item: new Rectangle({ fill: black }),
                rect: [ 0, axis_y - bar_half, width, axis_y + bar_half ],
            })
        }

        // compute layout
        const { children, coord, aspect, metrics } = layout_inline_placements(placements)

        // pass to Group
        super({ children, coord, aspect, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord', metrics })
    }
}

//
// sqrt
//

type SqrtLayout = {
    aspect: number
    body_rect: Rect
    index_pos: Point
    radical_points: Point[]
}

function compute_sqrt_layout(body_aspect: number): SqrtLayout {
    const gutter = 0.5
    const aspect = gutter + body_aspect
    const body_left = gutter / aspect
    return {
        aspect,
        body_rect: [ body_left, 0, 1, 1 ],
        index_pos: [ 0.6 * body_left, 0.2 ],
        radical_points: [
            [0, 0.6],
            [0.1 * body_left, 0.5],
            [0.42 * body_left, 0.9],
            [body_left, 0],
            [1, 0],
        ],
    }
}

interface SqrtArgs extends GroupArgs {
    index?: Element | null
    padding?: Padding
}

// TODO: math metrics
class Sqrt extends Group {
    math: MathSpec

    constructor(args: SqrtArgs = {}) {
        const {
            children,
            index = null,
            color,
            padding = [0, 0.1, 0.1, 0.1],
            line_width = 0.05,
            ...attr
        } = THEME(args, 'Sqrt')
        const body = check_singleton(children)

        // compute layout for radical
        const body_aspect = body.spec.aspect ?? 1
        const { aspect, body_rect, radical_points, index_pos } = compute_sqrt_layout(body_aspect)

        // build body box
        const bodyBox = new Box({ children: [ body ], rect: body_rect, padding })
        const radical = new CoordLine({ points: radical_points, line_width, stroke: color, stroke_linecap: 'round', stroke_linejoin: 'round' })

        // build optional index element
        const indexElem = index != null ? index.clone({ pos: index_pos, yrad: 0.2, align: 'right' }) : null

        // pass to Group
        super({ children: [ bodyBox, indexElem, radical ], aspect, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord' })
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

// TODO: math metrics
class Accent extends Box {
    math: MathSpec

    constructor(args: AccentArgs = {}) {
        const { children, label = '', body_top = 0.5, color, ...attr } = THEME(args, 'Accent')
        const child = check_singleton(children)
        const base = normalize_math_leaf(child)

        // check child
        if (base == null) {
            throw new Error('Accent must have exactly one child')
        }

        // build accent symbol
        const accent = build_accent_symbol(label, color)

        // pass to Box
        super({ children: [ base, accent ], ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord' })
    }
}

//
// bracket
//

type DelimType = 'round' | 'square' | 'curly' | 'angle'

function delimiter_font(size: number): FontFamily {
    if (size >= 5) return 'KaTeX_Size4'
    if (size == 4) return 'KaTeX_Size3'
    if (size == 3) return 'KaTeX_Size2'
    if (size == 2) return 'KaTeX_Size1'
    return 'KaTeX_Main'
}

function get_delim_text(delim: string | undefined, side: 'left' | 'right'): string {
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

interface BracketArgs extends StackArgs {
    delim?: DelimType | [ DelimType, DelimType ]
}

// TODO: math metrics
class Bracket extends HStack {
    math: MathSpec

    constructor(args: BracketArgs = {}) {
        const { children: children0, delim: delim0 = 'round', ...attr0 } = THEME(args, 'Bracket')
        const body = check_singleton(children0)
        const [ left_delim, right_delim ] = ensure_vector(delim0, 2)
        const [ delim_attr, attr ] = prefix_split([ 'delim' ], attr0)

        // auto-detect delimiter size
        const left = left_delim != null ? new Delim({ delim: left_delim, side: 'left', ...delim_attr }) : null
        const right = right_delim != null ? new Delim({ delim: right_delim, side: 'right', ...delim_attr }) : null

        // make math spec
        const math = make_math({ left: 'mord', right: 'mord' })

        // pass to HStack
        super({ children: [ left, body, right ], math, ...attr })
        this.args = args

        // set math metrics
        this.math = make_math({ left: 'mord', right: 'mord' })
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
            return new MathSpacer({ aspect: em })
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

export { MathSpan, MathSymbol, MathText, SupSub, Frac, Sqrt, Bracket, Latex, Tex }
export type { MathClass, MathSpec, FontFamily, MathSymbolArgs, MathTextArgs }
