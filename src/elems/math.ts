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
    italic: number  // superscript overhang past advance (TeX italic correction)
    hrange?: Limit  // horizontal ink range from the cursor origin, when it differs from [0, advance] (TeX \rlap etc.)
}

type InlineMetrics = Pick<MathSpec, 'advance' | 'vrange' | 'vanchor'> & Partial<Pick<MathSpec, 'italic' | 'hrange'>>

type WithMath<E extends Element = Element> = E & {
    math: MathSpec
}

//
// fonts
//

const OP_TEXT_FONT: FontFamily = 'KaTeX_Size1'
const OP_DISPLAY_FONT: FontFamily = 'KaTeX_Size2'

const SYMBOL_MODE_FONT: Record<SymbolMode, FontFamily> = {
    math: 'KaTeX_Math',
    text: 'KaTeX_Main',
}

const TEX_FONT_FAMILY: Record<string, FontFamily | undefined> = {
    mathbb: 'KaTeX_AMS',
}

//
// constants
//

const MATH_AXIS = 0.25
const INLINE_SHIFT = -0.1
const STRUT: Limit = [ -0.5, 0.5 ]  // minimum line box around the axis for top-level math

// TeX font parameters (Computer Modern, in em) that drive Appendix G layout;
// script-font parameters (sup_drop, sub_drop) are given in script em
const TEX = {
    x_height: 0.431,
    rule: 0.04,         // default rule thickness
    sup1: 0.413,        // sup shift, display
    sup2: 0.363,        // sup shift, text and scripts
    sub1: 0.15,         // sub shift, no sup
    sub2: 0.247,        // sub shift, with sup
    sup_drop: 0.386,    // sup baseline below top of tall base
    sub_drop: 0.05,     // sub baseline below bottom of tall base
    num1: 0.677,        // numerator shift, display
    num2: 0.394,        // numerator shift, text
    num3: 0.444,        // numerator shift, display no bar
    denom1: 0.686,      // denominator shift, display
    denom2: 0.345,      // denominator shift, text
    bigop1: 0.111,      // min gap: upper limit above op
    bigop2: 0.166,      // min gap: lower limit below op
    bigop3: 0.2,        // upper limit baseline clearance
    bigop4: 0.6,        // lower limit baseline clearance
    bigop5: 0.1,        // padding above/below limits
    script_space: 0.05, // space after scripts
    accent_gap: 0.12,   // accent ink above x-height (as designed in the fonts)
}

//
// math styles
//

// TeX-style size regimes: scripts descend one level, fraction contents descend
// in inline styles, and glyph scale is fixed per level rather than derived
// from the surrounding geometry
type MathStyle = 'display' | 'text' | 'script' | 'scriptscript'

const STYLE_SCALE: Record<MathStyle, number> = {
    display: 1,
    text: 1,
    script: 0.7,
    scriptscript: 0.5,
}

function script_style(style: MathStyle): MathStyle {
    return (style == 'display' || style == 'text') ? 'script' : 'scriptscript'
}

function frac_style(style: MathStyle): MathStyle {
    return style == 'display' ? 'text' : script_style(style)
}

function is_script_style(style: MathStyle): boolean {
    return style == 'script' || style == 'scriptscript'
}

function relative_scale(outer: MathStyle, inner: MathStyle): number {
    return STYLE_SCALE[inner] / STYLE_SCALE[outer]
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

function make_math({ left, right, advance, vrange, vanchor, italic, hrange }: Partial<MathSpec>): MathSpec {
    return {
        left: left ?? 'mord',
        right: right ?? 'mord',
        advance: advance ?? EMPTY_INLINE_METRICS.advance,
        vrange: vrange ?? EMPTY_INLINE_METRICS.vrange,
        vanchor: vanchor ?? EMPTY_INLINE_METRICS.vanchor,
        italic: italic ?? 0,
        hrange,
    }
}

function text_inline_metrics({ advance, vrange, italic }: TextMetrics): InlineMetrics {
    return { advance, vrange, vanchor: MATH_AXIS, italic }
}

function metrics_bounds({ vrange: [ ylo, yhi ], vanchor }: InlineMetrics): Limit {
    return [ ylo - vanchor, yhi - vanchor ]
}

function metrics_height({ vrange: [ ylo, yhi ] }: InlineMetrics): number {
    return yhi - ylo
}

function metrics_hrange({ advance, hrange }: InlineMetrics): Limit {
    return hrange ?? [ 0, advance ]
}

// the ink box aspect: width from hrange (advance unless overhanging), height from vrange
function metrics_aspect(metrics: InlineMetrics): number | undefined {
    const [ xlo, xhi ] = metrics_hrange(metrics)
    const height = metrics_height(metrics)
    return height > 0 ? (xhi - xlo) / height : undefined
}

function metrics_rect(metrics: InlineMetrics, x: number = 0, y: number = 0): Rect {
    const [ xlo, xhi ] = metrics_hrange(metrics)
    const [ ylo, yhi ] = metrics_bounds(metrics)
    return [ x + xlo, y + ylo, x + xhi, y + yhi ]
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

// scale an element's inline metrics uniformly: children in smaller styles are
// laid out at relative scale, and rendering follows the metrics
function scale_math<E extends Element>(element: WithMath<E>, scale: number): WithMath<E> {
    if (scale == 1) return element
    const { advance, vrange: [ ylo, yhi ], vanchor, italic, hrange } = element.math
    return with_math(element, {
        advance: scale * advance,
        vrange: [ scale * ylo, scale * yhi ],
        vanchor: scale * vanchor,
        italic: scale * italic,
        hrange: hrange != null ? [ scale * hrange[0], scale * hrange[1] ] : undefined,
    })
}

function ensure_math_children(children: Element[]): WithMath[] {
    return children.map(child => ensure_math(child))
}

// make an element opaque to row flattening: a MathText splices the items of
// nested MathText rows, which would discard any metrics patched onto the row
// itself (scaling, zero advance, class overrides). A single-item row is just
// that item; longer rows are wrapped in a MathRow carrying their metrics
function seal_math(element: WithMath): WithMath {
    if (!(element instanceof MathText)) return element
    if (element.items.length == 1) return element.items[0]
    const { left, right } = element.math
    return with_math(new MathRow({ children: [ element ] }), { left, right })
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

function inter_item_spacing(prev: WithMath | null, next: WithMath | null, script: boolean = false): number {
    if (prev == null || next == null) return 0
    const { right: prevRight } = prev.math
    const { left: nextLeft } = next.math
    const measurement = SPACING_TABLE[prevRight]?.[nextLeft]
    if (measurement == null) return 0
    if (script && measurement != THINSPACE) return 0
    return measurement_to_em(measurement)
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

        // glue carries no atom class
        this.math = make_math({ left: 'none', right: 'none', advance, vrange, vanchor: 0 })
    }
}

//
// math span
//

interface MathSpanArgs extends SpanArgs {
    klass?: MathClass
    left?: MathClass
    right?: MathClass
    center?: boolean
}

// a glyph atom with TeX-style ink metrics: the math box is the ink extent at
// the glyph's natural size (undoing the 1em line-box normalization of text
// metrics), with the baseline 0.25em below the axis, or the ink centered on
// the axis for large operators and delimiters (TeX Rule 13)
class MathSpan extends Span {
    math: MathSpec

    constructor(args: MathSpanArgs = {}) {
        const { children, klass = 'mord', left = klass, right = left, center = false, ...attr } = THEME(args, 'MathSpan')
        const text = check_string(children)

        // pass to Span
        super({ children: [ text ], ...attr })
        this.args = args

        // recover ink extents above/below the baseline at a 1em font (y-up)
        const { advance: advance0, vrange: [ vlo, vhi ], raw_vrange: [ rlo, rhi ] = [ vlo, vhi ], italic: italic0 = 0 } = this.metrics
        const fh = vhi - vlo
        if (fh <= 0 || rhi <= rlo) {
            this.math = make_math({ left, right, ...text_inline_metrics(this.metrics) })
            return
        }
        const ymax = (vhi - rlo) / fh
        const ymin = (vhi - rhi) / fh
        const height = ymax - ymin
        const advance = advance0 / fh
        const italic = italic0 / fh

        // ink box in anchor coords (y-down, axis at 0)
        const baseline = center ? 0.5 * (ymax + ymin) : MATH_AXIS
        const vrange: Limit = [ baseline - ymax, baseline - ymin ]

        // Span places text in a 1em box ending at the baseline; make the ink box
        // the coordinate frame so any assigned rect scales the glyph with its box
        const aspect = advance / height
        this.metrics = { advance, vrange: [ baseline - 1, baseline ], raw_vrange: vrange, italic }
        this.spec.coord = [ 0, vrange[0], 1, vrange[1] ]
        this.spec.aspect0 = aspect
        this.spec.aspect = this.spec.rotate_invar ? aspect : rotate_aspect(aspect, this.spec.rotate)

        // set math metrics
        this.math = make_math({ left, right, advance, vrange, vanchor: 0, italic })
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
// math operator
//

// operators whose scripts stack as limits in display style (from katex's
// functions/op.js); other symbol operators (\int, ...) and named functions
// (\sin, ...) take side scripts
const OP_SYMBOL_LIMITS = [
    '\\coprod', '\\bigvee', '\\bigwedge', '\\biguplus', '\\bigcap', '\\bigcup', '\\intop', '\\prod', '\\sum',
    '\\bigotimes', '\\bigoplus', '\\bigodot', '\\bigsqcup', '\\smallint',
]
const OP_NAME_LIMITS = [ '\\det', '\\gcd', '\\inf', '\\lim', '\\max', '\\min', '\\Pr', '\\sup' ]

// unicode big operators map to their command names
const OP_UNICODE: Record<string, string> = {
    '\u220F': '\\prod', '\u2210': '\\coprod', '\u2211': '\\sum', '\u22c0': '\\bigwedge', '\u22c1': '\\bigvee',
    '\u22c2': '\\bigcap', '\u22c3': '\\bigcup', '\u2a00': '\\bigodot', '\u2a01': '\\bigoplus', '\u2a02': '\\bigotimes',
    '\u2a04': '\\biguplus', '\u2a06': '\\bigsqcup', '\u222b': '\\int', '\u222c': '\\iint', '\u222d': '\\iiint',
    '\u222e': '\\oint', '\u222f': '\\oiint', '\u2230': '\\oiiint',
}

interface OpEntry {
    name: string
    symbol: boolean
    limits: boolean
}

// classify an operator by command name (`\sum`), unicode glyph (`∑`), or plain
// text (`lim`, `argmax`); unknown names fall back to named (text) operators
function get_op_entry(text: string): OpEntry {
    const name0 = OP_UNICODE[text] ?? text
    if (get_symbol_entry('math', name0)?.family == 'op-token') {
        return { name: name0, symbol: true, limits: OP_SYMBOL_LIMITS.includes(name0) }
    }
    const name = name0.startsWith('\\') ? name0.slice(1) : name0
    const limits = OP_NAME_LIMITS.includes(`\\${name}`)
    return { name, symbol: false, limits }
}

interface MathOpArgs extends MathSymbolArgs {
    style?: MathStyle
    limits?: boolean
}

// large operator or named function: symbol operators (∑, ∫, ...) are glyphs
// centered on the axis (TeX Rule 13) at the size for the given style, while
// named operators (lim, sin, ...) are upright text on the baseline. `limits`
// overrides the operator's intrinsic flag; scripts stack as limits only in
// display style (TeX Rule 13a), which `SupSub` reads from `this.limits`
class MathOp extends MathSymbol {
    limits: boolean

    constructor(args: MathOpArgs = {}) {
        const { children, style = 'display', limits: limits0, klass = 'mop', ...attr } = THEME(args, 'MathOp')
        const text = check_string(children)

        // look up operator entry
        const { name, symbol, limits: limits1 } = get_op_entry(text)
        const props = symbol ?
            { mode: 'math' as SymbolMode, center: true, font_family: style == 'display' ? OP_DISPLAY_FONT : OP_TEXT_FONT } :
            { mode: 'text' as SymbolMode, center: false }

        // pass to MathSymbol
        super({ children: [ name ], klass, ...props, ...attr })
        this.args = args

        // set limits flag
        const limits = limits0 ?? limits1
        this.limits = limits && style == 'display'
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
    const rects = items.map(item => {
        const { advance: x } = item.math
        xmax += x
        return metrics_rect(item.math, xmax - x, 0)
    })
    const children = items.map((item, i) => with_math(item, {}, { rect: rects[i] }))

    // the ink hull covers the advance plus any overhang from the items
    const [ xlo, xhi ] = merge_limits([ [ 0, advance ], ...rects.map(([ x1, , x2 ]) => [ x1, x2 ] as Limit) ])
    const hrange: Limit | undefined = (xlo == 0 && xhi == advance) ? undefined : [ xlo, xhi ]

    // compute layout metrics
    const metrics: InlineMetrics = { advance, vrange, vanchor: 0, hrange }
    const coord = join_limits({ h: [ xlo, xhi ], v: vrange })
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
    style?: MathStyle
    strut?: boolean
}

type MathLeaf = Element | string | number | boolean | null | undefined

// parse a TeX string into math elements in the given style, rendering the raw
// text in red on a parse error (as Latex does)
function parse_math(tex: string, attr: Attrs = {}, style: MathStyle = 'display'): WithMath {
    try {
        const tree = parse_tex(tex)
        return convert_tree(tree, attr, style)
    } catch (e) {
        return new MathSpan({ children: [ tex ], color: red })
    }
}

// elements pass through the inline protocol; strings, numbers, and booleans
// are parsed as TeX in the given style
function normalize_math_leaf(child: MathLeaf, style: MathStyle = 'text'): WithMath | undefined {
    if (child == null) {
        return
    } else if (child instanceof Element) {
        return ensure_math(child)
    } else if (is_scalar(child) || is_string(child) || is_boolean(child)) {
        const text = String(child)
        return parse_math(text, {}, style)
    } else {
        throw new Error(`Unknown math leaf type: ${typeof child}`)
    }
}

function normalize_math_children(children0: Element | Element[], style: MathStyle = 'text'): WithMath[] {
    const children = is_array(children0) ? children0 : [ children0 ]
    const out: WithMath[] = []

    for (const child of children) {
        if (child == null) {
            continue
        } else if (is_array(child)) {
            out.push(...normalize_math_children(child, style))
            continue
        }
        const elem = normalize_math_leaf(child, style)
        if (elem == null) {
            continue
        } else if (elem instanceof MathText) {
            out.push(...elem.items)
        } else {
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

function layoutMathText(mathItems: WithMath[], script: boolean = false): MathTextLayout {
    const rowItems: WithMath[] = []

    // accumulate math metrics
    let left: MathClass = 'none'
    let right: MathClass = 'none'
    let prevItem: WithMath | null = null

    // process items (glue with no class is transparent to spacing, as in TeX)
    for (const item of mathItems) {
        const { left: itemLeft, right: itemRight } = item.math
        const atom = itemLeft != 'none' || itemRight != 'none'

        // insert item with spacing
        const gap = atom ? inter_item_spacing(prevItem, item, script) : 0
        if (gap > 0) rowItems.push(new MathSpacer({ advance: gap }))
        rowItems.push(item)

        // update left/right classes
        if (!atom) continue
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
        const { children: children0, inline, style = 'text', strut = false, ...attr } = THEME(args, 'MathText')
        const inputs = ensure_children(children0)
        const mathItems = normalize_math_children(inputs, style)

        // compress spacing and layout, with an optional strut (TeX \strut)
        // guaranteeing a minimum line box for top-level math
        const spacedItems = cancel_binary_atoms(mathItems)
        const { items: items0, left, right } = layoutMathText(spacedItems, is_script_style(style))
        const items = strut ? [ ...items0, new MathSpacer({ vrange: STRUT }) ] : items0

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
// explicit placement
//

// an item placed at an anchor position (x, y) in a shared anchor-relative
// frame; `align` centers or justifies it within a rect of the given width
type Placed = {
    item: WithMath
    x: number
    y: number
    width?: number
    align?: Align
}

// assemble explicitly placed items into a group whose anchor is at y = 0 and
// whose math box is the union of the placed boxes (optionally padded)
function place_items(placed: Placed[], pad: Limit = [ 0, 0 ], klass: MathClass = 'none'): WithMath<Group> {
    const children = placed.map(({ item, x, y, width, align }) => {
        const [ lo, hi ] = metrics_bounds(item.math)
        const rect: Rect = [ x, y + lo, x + (width ?? item.math.advance), y + hi ]
        return with_math(item, {}, { rect, ...(align != null ? { align } : {}) })
    })
    const advance = max(placed.map(({ item, x, width }) => x + (width ?? item.math.advance))) ?? 0
    const [ ylo0, yhi0 ] = merge_limits(placed.map(({ item, y }) => {
        const [ lo, hi ] = metrics_bounds(item.math)
        return [ y + lo, y + hi ] as Limit
    }))
    const [ ylo, yhi ] = [ ylo0 - pad[0], yhi0 + pad[1] ]

    const metrics: InlineMetrics = { advance, vrange: [ ylo, yhi ], vanchor: 0 }
    const coord: Rect = [ 0, ylo, advance, yhi ]
    const group = new Group({ children, coord, aspect: metrics_aspect(metrics) })
    return with_math(group, { left: klass, right: klass, ...metrics })
}

// height above and depth below the baseline of an item in a given style scale
// (its baseline sits MATH_AXIS * scale below its anchor)
function baseline_extents(item: WithMath, scale: number = 1): [ number, number ] {
    const [ lo, hi ] = metrics_bounds(item.math)
    const baseline = MATH_AXIS * scale
    return [ baseline - lo, hi - baseline ]
}

//
// sup/sub
//

// TeX Rule 18: scripts shift up/down from the base baseline by fixed style
// amounts, riding higher/lower on tall bases (sup_drop/sub_drop from the
// base's top and bottom), with the superscript kept clear of the x-height and
// the two scripts kept apart by 4 rule thicknesses; the superscript alone is
// shifted right by the base's italic correction
function layout_scripts(base: WithMath, sup: WithMath | null, sub: WithMath | null, style: MathStyle, rel: number): WithMath | null {
    if (sup == null && sub == null) return null

    // base extents and script extents (all in base em, relative to baselines)
    const [ hb, db ] = baseline_extents(base)
    const { italic } = base.math
    const u = hb - TEX.sup_drop * rel
    const v = db + TEX.sub_drop * rel

    // superscript shift up
    let supShift = 0
    let dsup = 0
    if (sup != null) {
        const [ , d ] = baseline_extents(sup, rel)
        const p = style == 'display' ? TEX.sup1 : TEX.sup2
        supShift = Math.max(u, p, d + 0.25 * TEX.x_height)
        dsup = d
    }

    // subscript shift down
    let subShift = 0
    if (sub != null) {
        const [ h ] = baseline_extents(sub, rel)
        if (sup == null) {
            subShift = Math.max(v, TEX.sub1, h - 0.8 * TEX.x_height)
        } else {
            subShift = Math.max(v, TEX.sub2)
            const gap = (supShift - dsup) - (h - subShift)
            if (gap < 4 * TEX.rule) subShift += 4 * TEX.rule - gap
            const psi = 0.8 * TEX.x_height - (supShift - dsup)
            if (psi > 0) { supShift += psi; subShift -= psi }
        }
    }

    // anchors of the scripts (their baselines sit MATH_AXIS * rel below)
    const placed: Placed[] = []
    if (sup != null) placed.push({ item: sup, x: italic, y: MATH_AXIS - supShift - MATH_AXIS * rel })
    if (sub != null) placed.push({ item: sub, x: 0, y: MATH_AXIS + subShift - MATH_AXIS * rel })
    return place_items(placed)
}

// TeX Rule 13a: limits centered above and below a large operator, split by
// half the italic correction, with minimum clearances from the operator
function layout_limits(base: WithMath, sup: WithMath | null, sub: WithMath | null, rel: number): WithMath<Group> {
    const [ blo, bhi ] = metrics_bounds(base.math)
    const { italic } = base.math
    const width = max([ base.math.advance, sup?.math.advance ?? 0, sub?.math.advance ?? 0 ].map(w => w + italic)) ?? 0
    const placed: Placed[] = [ { item: base, x: 0.5 * italic, y: 0, width: width - italic, align: 'center' } ]

    if (sup != null) {
        const [ , d ] = baseline_extents(sup, rel)
        const [ , shi ] = metrics_bounds(sup.math)
        const gap = Math.max(TEX.bigop1, TEX.bigop3 - d)
        placed.push({ item: sup, x: italic, y: blo - gap - shi, width: width - italic, align: 'center' })
    }
    if (sub != null) {
        const [ h ] = baseline_extents(sub, rel)
        const [ slo ] = metrics_bounds(sub.math)
        const gap = Math.max(TEX.bigop2, TEX.bigop4 - h)
        placed.push({ item: sub, x: 0, y: bhi + gap - slo, width: width - italic, align: 'center' })
    }

    const pad: Limit = [ sup != null ? TEX.bigop5 : 0, sub != null ? TEX.bigop5 : 0 ]
    return place_items(placed, pad)
}

interface SupSubArgs extends StackArgs {
    sup?: MathLeaf
    sub?: MathLeaf
    style?: MathStyle
    limits?: boolean
}

class SupSub extends MathRow {
    constructor(args: SupSubArgs = {}) {
        const { children, sup: sup0, sub: sub0, style = 'text', limits: limits0, ...attr } = THEME(args, 'SupSub')
        const child = ensure_singleton(children)
        const base = normalize_math_leaf(child, style)

        // check child
        if (base == null) {
            throw new Error('SupSub must have exactly one child')
        }

        // scripts render one style level down
        const sstyle = script_style(style)
        const rel = relative_scale(style, sstyle)
        const sup0m = normalize_math_leaf(sup0, sstyle)
        const sub0m = normalize_math_leaf(sub0, sstyle)
        const sup = sup0m != null ? scale_math(sup0m, rel) : null
        const sub = sub0m != null ? scale_math(sub0m, rel) : null

        // limits stack over/under (by default when the base is a display-style
        // operator that takes them); side scripts follow the base plus script space
        const limits = limits0 ?? (base instanceof MathOp && base.limits)
        let items: WithMath[]
        if (limits) {
            items = [ layout_limits(base, sup, sub, rel) ]
        } else {
            const scripts = layout_scripts(base, sup, sub, style, rel)
            const space = new MathSpacer({ advance: TEX.script_space })
            items = scripts != null ? [ base, scripts, space ] : [ base ]
        }

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
    style?: MathStyle
}

// TeX Rule 15: numerator and denominator baselines shift up/down from the
// fraction's baseline by fixed style amounts, pushed further apart if their
// ink would come within a clearance of the bar (which sits on the axis)
class Frac extends Group {
    math: MathSpec

    constructor(args: FracArgs = {}) {
        const { children: children0, has_bar = true, padding = [ 0.1, 0 ], rule_size = TEX.rule, style = 'display', ...attr } = THEME(args, 'Frac')
        const [ numer0, denom0 ] = check_array(children0, 2)
        const [ pad_x, pad_y ] = inline_padding(padding)
        const fstyle = frac_style(style)
        const numer1 = normalize_math_leaf(numer0, fstyle)
        const denom1 = normalize_math_leaf(denom0, fstyle)

        // check children
        if (numer1 == null || denom1 == null) {
            throw new Error('Frac must have exactly two children')
        }

        // fraction contents render one style level down in inline styles
        const rel = relative_scale(style, frac_style(style))
        const numer = scale_math(numer1, rel)
        const denom = scale_math(denom1, rel)

        // style parameters: baseline shifts and clearance from the bar
        const display = style == 'display'
        const numShift = display ? (has_bar ? TEX.num1 : TEX.num3) : TEX.num2
        const denShift = display ? TEX.denom1 : TEX.denom2
        const clearance = (has_bar ? (display ? 3 : 1) : (display ? 7 : 3)) * TEX.rule + pad_y
        const half = has_bar ? 0.5 * rule_size : 0

        // numerator: baseline MATH_AXIS - shift, pushed up to clear the bar
        const [ , dn ] = baseline_extents(numer, rel)
        const numBase = Math.min(MATH_AXIS - numShift, -(half + clearance + dn))
        const [ hd ] = baseline_extents(denom, rel)
        const denBase = Math.max(MATH_AXIS + denShift, half + clearance + hd)

        // assemble around the bar
        const width = Math.max(numer.math.advance, denom.math.advance) + 2 * pad_x
        const placed: Placed[] = [
            { item: numer, x: pad_x, y: numBase - MATH_AXIS * rel, width: width - 2 * pad_x, align: 'center' },
            { item: denom, x: pad_x, y: denBase - MATH_AXIS * rel, width: width - 2 * pad_x, align: 'center' },
        ]
        if (has_bar) {
            const bar = new MathRule({ advance: width, thickness: rule_size })
            placed.push({ item: bar, x: 0, y: 0 })
        }
        const body = place_items(placed)

        // pass to Group
        const { coord, aspect } = body.spec
        super({ children: body.children, coord, aspect, ...attr })
        this.args = args
        this.math = make_math({ ...body.math, left: 'minner', right: 'minner' })
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

        // build math-aware body box, floored to the strut line box (TeX's smallest
        // radical is a fixed glyph; only taller bodies grow the radical)
        const [ blo, bhi ] = metrics_bounds(body.math)
        const [ pl, pt, pr, pb ] = padding_rect(padding)
        const floored: Rect = [ pl, pt + Math.max(0, blo - STRUT[0]), pr, pb + Math.max(0, STRUT[1] - bhi) ]
        const bodyBox = new MathBox({ children: [ body ], padding: floored })
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
        const span = new MathSpan({ children: [ ACCENT_TEXT_FALLBACK[label1] ], ...span_attr })
        return scale_math(span, 0.5)
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

        // TeX Rule 12: the accent glyph is designed to sit above the x-height;
        // raise it to clear taller bases (ink bottom at max(base height, x-height)
        // plus the designed gap)
        const accent = build_accent_symbol(label, color)
        const [ hb ] = baseline_extents(base)
        const [ , ahi ] = metrics_bounds(accent.math)
        const bottom = MATH_AXIS - Math.max(hb, TEX.x_height) - TEX.accent_gap
        const dy = bottom - ahi

        // center both in a shared inline box
        const advance = max([ base.math.advance, accent.math.advance ]) ?? 0
        const body = place_items([
            { item: accent, x: 0.5 * (advance - accent.math.advance), y: dy },
            { item: base, x: 0.5 * (advance - base.math.advance), y: 0 },
        ])

        const { coord, aspect } = body.spec
        super({ children: body.children, coord, aspect, ...attr })
        this.args = args
        this.math = make_math({ ...body.math, left: base.math.left, right: base.math.right })
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

// delimiter glyphs are designed to be centered on the axis at every size
class Delim extends MathSymbol {
    constructor(args: DelimArgs = {}) {
        const { delim, side = 'left', mode = 'math', level = 1, ...attr } = THEME(args, 'Delim')
        const text = get_delim_text(delim, side)
        const font_family = delimiter_font(level)
        const klass = side == 'left' ? 'mopen' : 'mclose'
        super({ children: [ text ], mode, klass, font_family, center: true, ...attr })
    }
}

// TeX Rule 19: the delimiter must cover the body's extent above and below the
// axis (scaled by delimiterfactor, less delimitershortfall) and is never
// smaller than the text-size glyph; pick the nearest natural size, then scale
// to fit exactly
const DELIM_LEVELS = 5
const DELIM_FACTOR = 0.901
const DELIM_SHORTFALL = 0.5

function fit_delim(delim: string, side: 'left' | 'right', target: number, level0: number | undefined, attr: Attrs): WithMath<Delim> {
    if (level0 != null) return new Delim({ delim, side, level: level0, ...attr })

    let best: Delim | null = null
    let bestError = Infinity
    for (let level = 1; level <= DELIM_LEVELS; level++) {
        const candidate = new Delim({ delim, side, level, ...attr })
        const [ lo, hi ] = metrics_bounds(candidate.math)
        const half = 0.5 * (hi - lo)
        const error = Math.abs(Math.log(target / half))
        if (error < bestError) { best = candidate; bestError = error }
    }

    const [ lo, hi ] = metrics_bounds(best!.math)
    return scale_math(best!, target / (0.5 * (hi - lo)))
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

        // required half-height around the axis
        const [ blo, bhi ] = metrics_bounds(body.math)
        const extent = Math.max(-blo, bhi)
        const target = Math.max(DELIM_FACTOR * extent, extent - 0.5 * DELIM_SHORTFALL, 0.5)

        // fit delimiters
        const baseDelimAttr = { ...shared_attr, ...delim_attr1 }
        const left = left_delim != null ? fit_delim(left_delim, 'left', target, level0, baseDelimAttr) : null
        const right = right_delim != null ? fit_delim(right_delim, 'right', target, level0, baseDelimAttr) : null
        const items = [ left, body, right ].filter(item => item != null)

        // pass to MathRow
        super({ children: items, ...shared_attr, ...spec })
        this.args = args

        // a delimited group is an inner atom
        this.math.left = 'minner'
        this.math.right = 'minner'
    }
}

//
// parse katex tree
//

const EMPTY_MATH = new MathSpacer()

function convert_tree(tree: Tree | TreeNode | null, attr: Attrs = {}, style: MathStyle = 'display'): WithMath {
    if (tree == null) return EMPTY_MATH

    if (is_array(tree)) {
        const row = new MathText({ children: tree.map(node => convert_tree(node, attr, style)), style })
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
            // a braced group is a single Ord atom for spacing (TeX Rule 20)
            const { body } = tree
            const inner = seal_math(convert_tree(body, attr, style))
            return with_math(inner, { left: 'mord', right: 'mord' })
        } else if (type == 'op') {
            const { name, limits } = tree
            return new MathOp({ children: [ name ], style, limits, ...attr })
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body, attr, style)
        } else if (type == 'font') {
            const { font, body } = tree
            const font_family = TEX_FONT_FAMILY[font]
            const font_attr = font_family == null ? {} : { font_family }
            return convert_tree(body, { ...attr, ...font_attr }, style)
        } else if (type == 'accent') {
            const { label, base: base0 } = tree
            const base = convert_tree(base0, attr, style)
            return new Accent({ children: [ base ], label, ...attr })
        } else if (type == 'kern') {
            const { dimension } = tree
            const em = measurement_to_em(dimension)
            return new MathSpacer({ advance: em })
        } else if (type == 'spacing') {
            const { mode, text } = tree
            const entry = get_symbol_entry(mode, text)
            if (entry?.replace == null) return EMPTY_MATH
            return new MathSymbol({ children: [ text ], mode, ...attr })
        } else if (type == 'mclass') {
            const { mclass, body } = tree
            const inner = seal_math(convert_tree(body, attr, style))
            return with_math(inner, { left: mclass, right: mclass })
        } else if (type == 'lap') {
            // zero-advance box with content overhanging right (rlap), left (llap), or both (clap)
            const { alignment, body } = tree
            const inner = seal_math(convert_tree(body, attr, style))
            const [ xlo, xhi ] = metrics_hrange(inner.math)
            const shift = alignment == 'rlap' ? 0 : alignment == 'llap' ? -inner.math.advance : -0.5 * inner.math.advance
            return with_math(inner, { advance: 0, hrange: [ xlo + shift, xhi + shift ] })
        } else if (type == 'htmlmathml') {
            // katex renders these differently for html and mathml; follow html
            const { html } = tree
            return convert_tree(html, attr, style)
        } else if (type == 'styling') {
            const { style: style1, body } = tree
            const inner = seal_math(convert_tree(body, attr, style1))
            return scale_math(inner, relative_scale(style, style1))
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const sstyle = script_style(style)
            const base = convert_tree(base0, attr, style)
            const sup = sup0 ? convert_tree(sup0, attr, sstyle) : null
            const sub = sub0 ? convert_tree(sub0, attr, sstyle) : null
            return new SupSub({ children: [ base ], sup, sub, style, ...attr })
        } else if (type == 'genfrac') {
            const { mode = 'math', numer: numer0, denom: denom0, hasBarLine = true, leftDelim, rightDelim } = tree
            const fstyle = frac_style(style)
            const numer = convert_tree(numer0, attr, fstyle)
            const denom = convert_tree(denom0, attr, fstyle)
            const frac = new Frac({ children: [ numer, denom ], has_bar: hasBarLine, style, ...attr })
            if (leftDelim != null || rightDelim != null) {
                return new Bracket({ children: [ frac ], left_delim: leftDelim, right_delim: rightDelim, mode, ...attr })
            }
            return frac
        } else if (type == 'sqrt') {
            const { body: body0, index: index0 } = tree
            const body = convert_tree(body0, attr, style)
            const index = index0 ? convert_tree(index0, attr, 'scriptscript') : null
            return new Sqrt({ children: [ body ], index, ...attr })
        } else if (type == 'leftright') {
            const { mode, body: body0, left, right } = tree
            const body = convert_tree(body0, attr, style)
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

interface LatexArgs extends ElementArgs {
    inline?: boolean
    style?: MathStyle
    strut?: boolean
}

class Latex extends MathText {
    constructor(args: LatexArgs = {}) {
        const { children, inline, style = inline ? 'text' : 'display', strut = true, ...attr0 } = THEME(args, 'Latex')
        const tex = check_string(children)
        const [ spec, attr ] = spec_split(attr0)

        // parse and convert to math elements
        const elems = [ parse_math(tex, attr, style) ]

        // pass to MathText
        super({ children: elems, inline, style, strut, ...spec })
        this.args = args
    }
}

class Tex extends Latex {
    constructor({ inline = true, ...args }: LatexArgs = {}) {
        super({ inline, ...args })
    }
}

//
// exports
//

export { MathSpan, MathSymbol, MathOp, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathText, SupSub, Frac, Sqrt, Accent, Bracket, Latex, Tex }
export type { MathClass, MathSpec, MathStyle, InlineMetrics, FontFamily, MathSymbolArgs, MathOpArgs, MathTextArgs }
