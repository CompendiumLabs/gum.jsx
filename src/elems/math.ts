// math components

import { THEME } from '../lib/theme'
import { none, black, red, maxis, d2r } from '../lib/const'
import { EMPTY_VRANGE, DEFAULT_VRANGE, textHasGlyphs, type TextMetrics } from '../lib/text'
import { StrictError, strictError } from '../lib/strict'
import { is_array, is_scalar, is_string, is_boolean, is_object, check_singleton, ensure_singleton, check_array, check_string, ensure_vector, merge_limits, prefix_split, join_limits, sum, max, range, rotate_aspect } from '../lib/utils'
import symbols from '../lib/symbols'
import { Context, Element, Group, Spacer, Rectangle, spec_split, ensure_children } from './core'
import { Polygon, Line, Arc, Arrow, ArrowHead } from './geometry'
import { Span } from './text'
import { __parse as parse_tex } from 'katex'

import type { Padding, Rounded, Point, Rect, Limit, Align, Attrs } from '../lib/types'
import type { ElementArgs, GroupArgs } from './core'
import type { SpanArgs } from './text'
import type { Measurement, SymbolMode, SymbolFamily, SymbolFont, SymbolEntry, Tree, TreeNode, TreeHorizBrace, TreeXArrow, TreeOperatorName } from 'katex'

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
    scale: number   // style scale applied to the content, so its baseline sits MATH_AXIS * scale below the anchor
    hrange?: Limit  // horizontal ink range from the cursor origin, when it differs from [0, advance] (TeX \rlap etc.)
}

type InlineMetrics = Pick<MathSpec, 'advance' | 'vrange' | 'vanchor'> & Partial<Pick<MathSpec, 'italic' | 'scale' | 'hrange'>>

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

// text-mode font commands that need no override: KaTeX_Main-Regular, the face
// text already renders in, is the right answer for all of them. The rest
// (\textbf, \textit, \texttt, \textsf, \emph) need Main-Bold/Main-Italic/
// Typewriter/SansSerif, which are not among the loaded faces
const TEXT_FONT_NEUTRAL = new Set([ '\\text', '\\textnormal', '\\textrm', '\\textup', '\\textmd' ])

//
// constants
//

const MATH_AXIS = maxis
const STRUT: Limit = [ -0.5, 0.5 ]  // minimum line box around the axis for top-level math

// TeX font parameters (Computer Modern, in em) that drive Appendix G layout;
// script-font parameters (sup_drop, sub_drop) are given in script em
const TEX = {
    x_height: 0.431,
    rule: 0.04,         // default rule thickness
    frac_rule: 0.03,    // lighter fraction bar
    sup1: 0.413,        // sup shift, display
    sup2: 0.363,        // sup shift, text and scripts
    sup3: 0.289,        // sup shift, cramped styles
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
    delim1: 2.39,       // delimiter height for generalized fractions, display (sigma20)
    delim2: 1.01,       // same in text style (sigma21)
    delim2_script: 1.157,  // sigma21 of the script-size font, used in script styles
}

//
// math styles
//

// TeX's eight styles pair four size regimes with cramped/uncramped vertical
// layout. Cramping preserves glyph size but changes script placement and is
// inherited by superscripts; subscripts and fraction denominators are cramped.
type MathSizeStyle = 'display' | 'text' | 'script' | 'scriptscript'
type MathStyle = MathSizeStyle | `${MathSizeStyle}-cramped`

const STYLE_SCALE: Record<MathSizeStyle, number> = {
    display: 1,
    text: 1,
    script: 0.7,
    scriptscript: 0.5,
}

function style_size(style: MathStyle): MathSizeStyle {
    const suffix = '-cramped'
    return style.endsWith(suffix) ? style.slice(0, -suffix.length) as MathSizeStyle : style as MathSizeStyle
}

function is_cramped_style(style: MathStyle): boolean {
    return style.endsWith('-cramped')
}

function make_style(size: MathSizeStyle, cramped: boolean): MathStyle {
    return cramped ? `${size}-cramped` : size
}

function cramped_style(style: MathStyle): MathStyle {
    return make_style(style_size(style), true)
}

function next_script_size(style: MathStyle): MathSizeStyle {
    const size = style_size(style)
    return (size == 'display' || size == 'text') ? 'script' : 'scriptscript'
}

function sup_style(style: MathStyle): MathStyle {
    return make_style(next_script_size(style), is_cramped_style(style))
}

function sub_style(style: MathStyle): MathStyle {
    return make_style(next_script_size(style), true)
}

function next_frac_size(style: MathStyle): MathSizeStyle {
    const size = style_size(style)
    if (size == 'display') return 'text'
    if (size == 'text') return 'script'
    return 'scriptscript'
}

function frac_num_style(style: MathStyle): MathStyle {
    return make_style(next_frac_size(style), is_cramped_style(style))
}

function frac_den_style(style: MathStyle): MathStyle {
    return make_style(next_frac_size(style), true)
}

function is_script_style(style: MathStyle): boolean {
    const size = style_size(style)
    return size == 'script' || size == 'scriptscript'
}

function relative_scale(outer: MathStyle, inner: MathStyle): number {
    return STYLE_SCALE[style_size(inner)] / STYLE_SCALE[style_size(outer)]
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

function make_math({ left, right, advance, vrange, vanchor, italic, scale, hrange }: Partial<MathSpec>): MathSpec {
    return {
        left: left ?? 'mord',
        right: right ?? 'mord',
        advance: advance ?? EMPTY_INLINE_METRICS.advance,
        vrange: vrange ?? EMPTY_INLINE_METRICS.vrange,
        vanchor: vanchor ?? EMPTY_INLINE_METRICS.vanchor,
        italic: italic ?? 0,
        scale: scale ?? 1,
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
    const { advance, vrange: [ ylo, yhi ], vanchor, italic, scale: scale0, hrange } = element.math
    return with_math(element, {
        advance: scale * advance,
        vrange: [ scale * ylo, scale * yhi ],
        vanchor: scale * vanchor,
        italic: scale * italic,
        scale: scale * scale0,
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

        // try to get symbol entry; an unresolved command name (as opposed to a
        // literal character) would otherwise be drawn verbatim, backslash and all
        const entry = get_symbol_entry(mode, text)
        if (entry == null && text.startsWith('\\')) {
            strictError('symbol', `no ${mode}-mode symbol '${text}'`)
        }
        const { font, family, replace } = entry ??
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
        const display = style_size(style) == 'display'
        const props = symbol ?
            { mode: 'math' as SymbolMode, center: true, font_family: display ? OP_DISPLAY_FONT : OP_TEXT_FONT } :
            { mode: 'text' as SymbolMode, center: false }

        // pass to MathSymbol
        super({ children: [ name ], klass, ...props, ...attr })
        this.args = args

        // set limits flag
        const limits = limits0 ?? limits1
        this.limits = limits && display
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
    rounded?: Rounded
    fill?: string
}

class MathRule extends Group {
    math: MathSpec

    constructor(args: MathRuleArgs = {}) {
        const { advance = 1, thickness = 0.033, fill = black, ...attr } = THEME(args, 'MathRule')

        // Rules are filled shapes, not outlined shapes. Disabling the inherited
        // SVG stroke avoids a second, slightly larger bar around the fill.
        const bar = thickness > 0 ? new Rectangle({ rect: [ 0, 0, advance, thickness ], fill, stroke: none }) : null

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
// math array
//

// LaTeX array metrics (article.cls / lttab.dtx / ltmath.dtx), in em at
// ptPerEm = 10, matching katex's fontMetrics
const ARRAY_PT = 0.1
const ARRAY_BASELINE_SKIP = 12 * ARRAY_PT  // \baselineskip from size10.clo
const ARRAY_JOT = 3 * ARRAY_PT             // \jot, extra leading in aligned/gathered
const ARRAY_COL_SEP = 5 * ARRAY_PT         // \arraycolsep
const ARRAY_RULE = 0.04                    // \arrayrulewidth
const ARRAY_DOUBLE_RULE_SEP = 0.2          // \doublerulesep
const ARRAY_SMALL_SEP = 0.2778             // \thickspace, used by {smallmatrix}
const ARRAY_HLINE_GAP = 0.25               // gap between stacked \hline rules
const ARRAY_DASH = 0.08                    // dash length for \hdashline and ':'

// a column descriptor: either an alignment (with optional explicit gaps) or a
// vertical separator drawn between columns
type ArrayAlign = 'l' | 'c' | 'r'
type ArrayCol =
    | { type: 'align', align: ArrayAlign, pregap?: number, postgap?: number }
    | { type: 'separator', separator: string }

const ARRAY_ALIGN: Record<ArrayAlign, Align> = { l: 'left', c: 'center', r: 'right' }

interface MathArrayArgs extends Omit<GroupArgs, 'children'> {
    children?: WithMath[][] | WithMath[]  // rows of cells, or a flat list chunked by ncol
    cols?: ArrayCol[]              // column alignments and separators
    ncol?: number                  // columns to chunk a flat child list into
    stretch?: number               // \arraystretch
    jot?: boolean                  // add \jot of leading between rows
    colsep?: number                // column separation (default \arraycolsep)
    outer?: boolean                // pad the outer edges by colsep too
    hlines?: boolean[][]           // rules before each row; true means dashed
    rowgaps?: (number | null)[]    // extra gap after each row, in em
    thickness?: number             // rule thickness
    fill?: string                  // rule color
}

// a horizontal or vertical rule inside an array, as a filled shape in array
// coordinates; a dashed rule is drawn as a run of short filled segments so it
// scales with the font like every other rule
function array_rules(x1: number, y1: number, x2: number, y2: number, dashed: boolean, fill: string): Element[] {
    if (!dashed) return [ new Rectangle({ rect: [ x1, y1, x2, y2 ], fill, stroke: none }) ]
    const horiz = (x2 - x1) >= (y2 - y1)
    const span = horiz ? x2 - x1 : y2 - y1
    const step = 2 * ARRAY_DASH
    const count = Math.max(1, Math.round(span / step))
    const size = span / (2 * count - 1)
    return range(count).map(i => {
        const lo = (horiz ? x1 : y1) + 2 * i * size
        const hi = lo + size
        const rect: Rect = horiz ? [ lo, y1, Math.min(hi, x2), y2 ] : [ x1, lo, x2, Math.min(hi, y2) ]
        return new Rectangle({ rect, fill, stroke: none })
    })
}

// cells either come as rows (how convert_tree builds them) or, since JSX
// flattens nested children, as one flat list chunked by the column count --
// the same bargain Grid strikes
function normalize_rows(children: WithMath[][] | WithMath[] | undefined, ncol0: number | undefined, cols: ArrayCol[]): Element[][] {
    if (children == null) return []
    const items: any[] = is_array(children as any) ? children as any[] : [ children ]
    if (items.length == 0) return []
    if (items.every(is_array)) return items.map(row => ensure_children(row))

    const flat = ensure_children(items as Element[])
    const ncol = Math.max(1, ncol0 ?? cols.filter(col => col.type == 'align').length)
    return range(Math.ceil(flat.length / ncol)).map(r => flat.slice(r * ncol, (r + 1) * ncol))
}

class MathArray extends Group {
    math: MathSpec

    constructor(args: MathArrayArgs = {}) {
        const {
            children: children0, cols = [], ncol: ncol0, stretch = 1, jot = false, colsep = ARRAY_COL_SEP,
            outer = false, hlines = [], rowgaps = [], thickness = ARRAY_RULE, fill = black, ...attr
        } = THEME(args, 'MathArray')
        const rows0 = normalize_rows(children0, ncol0, cols).map(row => ensure_math_children(row))

        // LaTeX gives every row a strut so short rows still occupy a full line
        const arrayskip = stretch * ARRAY_BASELINE_SKIP
        const strut_height = 0.7 * arrayskip
        const strut_depth = 0.3 * arrayskip

        // pass 1: walk down the rows accumulating height and depth about each
        // row's own baseline, recording where the \hline rules fall
        const rules: { pos: number, dashed: boolean }[] = []
        let total = 0
        const add_rules = (flags: boolean[] = []) => flags.forEach((dashed, i) => {
            if (i > 0) total += ARRAY_HLINE_GAP
            rules.push({ pos: total, dashed })
        })

        add_rules(hlines[0])
        const rows = rows0.map((cells, r) => {
            const extents = cells.map(cell => baseline_extents(cell))
            const height = max([ strut_height, ...extents.map(([ h ]) => h) ]) ?? strut_height
            let depth = max([ strut_depth, ...extents.map(([ , d ]) => d) ]) ?? strut_depth

            // \\[len] deepens the row rather than opening a gap, unless negative
            let gap = rowgaps[r] ?? 0
            if (gap > 0) {
                gap += strut_depth
                depth = Math.max(depth, gap)
                gap = 0
            }

            // \openup in the AMS multiline environments. \jot is leading
            // *between* lines, so the last row does not get it -- katex 0.16
            // adds it to every row, which pads the box; katex 0.18 fixed this
            if (jot && r < rows0.length - 1) depth += ARRAY_JOT

            total += height
            const pos = total
            total += depth + gap
            add_rules(hlines[r + 1])
            return { cells, pos }
        })

        // the array centers on the math axis, which is where gum's anchor line
        // already sits, so a row's baseline lands at pos - total / 2
        const offset = 0.5 * total
        const baseline = (pos: number) => pos - offset

        // column widths, over however many columns the widest row has
        const ncol = max(rows.map(({ cells }) => cells.length)) ?? 0
        const widths = range(ncol).map(c =>
            max(rows.map(({ cells }) => cells[c]?.math.advance ?? 0)) ?? 0
        )

        // pass 2: walk the columns and the column descriptors together, so a
        // trailing separator with no column after it still gets drawn
        const children: Element[] = []
        const seps: { x: number, dashed: boolean }[] = []
        let x = 0
        for (let c = 0, d = 0; c < ncol || d < cols.length; c++, d++) {
            let col = cols[d]

            // separators sit between columns and take no width of their own
            for (let first = true; col?.type == 'separator'; first = false) {
                if (!first) x += ARRAY_DOUBLE_RULE_SEP
                seps.push({ x, dashed: col.separator == ':' })
                col = cols[++d]
            }
            if (c >= ncol) continue

            // \arraycolsep before and after each column, except at the outer
            // edges unless the environment asks for it
            const align = col?.type == 'align' ? col.align : 'c'
            if (c > 0 || outer) x += col?.type == 'align' ? col.pregap ?? colsep : colsep

            for (const { cells, pos } of rows) {
                const cell = cells[c]
                if (cell == null) continue
                const [ lo, hi ] = metrics_bounds(cell.math)
                const y = baseline(pos) - MATH_AXIS
                const rect: Rect = [ x, y + lo, x + widths[c], y + hi ]
                children.push(with_math(cell, {}, { rect, align: ARRAY_ALIGN[align] }))
            }
            x += widths[c]

            if (c < ncol - 1 || outer) x += col?.type == 'align' ? col.postgap ?? colsep : colsep
        }
        const advance = x

        // rules span the full array: \hline across it, separators down it. A
        // \hline hangs above its row boundary (so the top rule adds its whole
        // thickness to the array) while a separator straddles its column
        // boundary, matching how LaTeX and katex place them
        const [ ytop, ybot ] = [ baseline(0), baseline(total) ]
        for (const { pos, dashed } of rules) {
            const y = baseline(pos)
            children.push(...array_rules(0, y - thickness, advance, y, dashed, fill))
        }
        for (const { x: xs, dashed } of seps) {
            children.push(...array_rules(xs - 0.5 * thickness, ytop, xs + 0.5 * thickness, ybot, dashed, fill))
        }

        // an \hline above the first row lifts the top of the box
        const vrange: Limit = [ Math.min(ytop, ...rules.map(({ pos }) => baseline(pos) - thickness)), ybot ]
        const metrics: InlineMetrics = { advance, vrange, vanchor: 0 }
        const coord: Rect = [ 0, ytop, advance, ybot ]

        // pass to Group
        super({ children, coord, aspect: metrics_aspect(metrics), ...attr })
        this.args = args

        // a tabular body is a single Ord atom
        this.math = make_math({ left: 'mord', right: 'mord', ...metrics })
    }
}

//
// horizontal brace
//

// katex draws its stretchy braces as SVG paths (no font has a stretchy brace
// glyph) sized 548/1000 em tall; the kerns come from its horizBrace builder
const BRACE_HEIGHT = 0.548
const BRACE_MIN_WIDTH = 1.6   // katex sets this as a css min-width on the brace
const BRACE_THICKNESS = 0.1   // along the runs; katex's brace path has a 0.12 em band there
const BRACE_THIN = 0.03       // at the free ends of the hooks and the peak
const BRACE_KERN = 0.1        // between the body and the brace
const BRACE_LABEL_KERN = 0.2  // between the brace and its label
const BRACE_SAMPLES = 12      // points per quarter turn

// shift a polyline sideways along its normals (by a constant distance or one
// per point); tracing one way and back gives the filled outline of a stroke,
// which is what math rules need -- an actual SVG stroke is specified in pixels
// and would not scale with the font
function offset_polyline(points: Point[], dist: number | number[]): Point[] {
    return points.map(([ x, y ], i) => {
        const d = is_array(dist) ? dist[i] : dist
        const [ ax, ay ] = points[Math.max(0, i - 1)]
        const [ bx, by ] = points[Math.min(points.length - 1, i + 1)]
        const [ dx, dy ] = [ bx - ax, by - ay ]
        const norm = Math.hypot(dx, dy) || 1
        return [ x - d * dy / norm, y + d * dx / norm ] as Point
    })
}

// filled outline of a horizontal brace pointing up: a hook curling down at each
// end and a peak in the middle, joined by straight runs. The centerline is four
// quarter circles of radius r, so the brace stands 2r tall and wants 4r of
// width (below that the runs vanish and r shrinks to fit). Like Computer
// Modern's, it is thick along the runs and thins into the free ends of the
// hooks and the tip of the peak; the ink is inset so it stays inside the box
function brace_outline(width: number, height: number, thick: number, thin: number): Point[] {
    const [ w, h, x0, y0 ] = [ width - thick, height - thick, 0.5 * thick, 0.5 * thick ]
    const r = Math.min(0.5 * h, 0.25 * w)
    const peak = h - 2 * r
    const n = BRACE_SAMPLES
    const ease = (f: number) => 0.5 - 0.5 * Math.cos(Math.PI * f)
    const arc = (cx: number, cy: number, a0: number, a1: number, t0: number, t1: number) =>
        range(n + 1).map(i => {
            const f = i / n
            const a = d2r * (a0 + (a1 - a0) * f)
            return { p: [ x0 + cx + r * Math.cos(a), y0 + cy + r * Math.sin(a) ] as Point, t: t0 + (t1 - t0) * ease(f) }
        })
    const segs = [
        ...arc(r, h, 180, 270, thin, thick),                   // left hook: thin free end up to the run
        ...arc(0.5 * w - r, peak, 90, 0, thick, thin),         // rise from the run to the peak
        ...arc(0.5 * w + r, peak, 180, 90, thin, thick).slice(1),  // fall from the peak
        ...arc(w - r, h, 270, 360, thick, thin),               // right hook down to its free end
    ]
    const line = segs.map(s => s.p)
    const half = segs.map(s => 0.5 * s.t)
    return [ ...offset_polyline(line, half), ...offset_polyline(line, half.map(d => -d)).reverse() ]
}

interface MathBraceArgs extends GroupArgs {
    advance?: number
    height?: number
    thickness?: number
    over?: boolean
    fill?: string
}

class MathBrace extends Group {
    math: MathSpec

    constructor(args: MathBraceArgs = {}) {
        const {
            advance: advance0 = 1, height: height0 = BRACE_HEIGHT,
            thickness = BRACE_THICKNESS, over = true, fill = black, ...attr
        } = THEME(args, 'MathBrace')

        // the outline is inset so the ink lands inside the advance and height
        const advance = Math.max(advance0, 2 * thickness)
        const height = Math.max(height0, 2 * thickness)
        const outline = brace_outline(advance, height, thickness, BRACE_THIN)
        const points = over ? outline : outline.map(([ x, y ]) => [ x, height - y ] as Point)

        // compute layout metrics
        const metrics: InlineMetrics = { advance, vrange: [ 0, height ], vanchor: 0 }
        const coord: Rect = [ 0, 0, advance, height ]

        // the polygon maps its points through its own context, which defaults
        // to the unit square, so it needs the brace's coord to draw in em
        const shape = new Polygon({ points, coord, fill, stroke: none })

        // pass to Group
        super({ children: [ shape ], coord, aspect: metrics_aspect(metrics), ...attr })
        this.args = args
        this.math = make_math({ left: 'mord', right: 'mord', ...metrics })
    }
}

//
// stretchy decorations
//

// katex draws all of these as SVG paths that stretch to the body, since no font
// carries stretchable versions. The box heights and minimum widths below are its
// katexImagesData, in em. The arrows are gum's own Arrow/ArrowHead/Line/Arc,
// stroked in em -- MathStretch rebases the stroke unit to pixels per em for its
// subtree, so a stroke_width of TEX.rule is a TeX rule at any size. Braces,
// groups and the \utilde tilde are still filled outlines (see MathBrace)
const STRETCH_THICKNESS = TEX.rule
const STRETCH_SAMPLES = 12
const STRETCH_LINE_GAP = 0.11   // between the rules of a double arrow or =
const STRETCH_ARC = 92          // ArrowHead's barb spread: cot(arc/2) is the head's depth per half-height, 0.97 in Computer Modern
const STRETCH_CURVE = 0.7       // ArrowHead's barb bow, matching Computer Modern's heads
const STRETCH_UNDER_KERN = 0.1  // clearance between a body and a decoration hung beneath it

// head size for a box: the barb ends reach the box edges less half a stroke, so
// the round caps stay inside the box (the box is the decoration's metrics)
function stretch_head_size(height: number, t: number): number {
    return 2 * Math.max(0.5 * height - 0.5 * t, 0) / Math.sin(0.5 * d2r * STRETCH_ARC)
}

// the box a shape draws into; `y` is the top of its band, so two arrows can
// stack in one box for \rightleftharpoons
type StretchBox = { width: number, height: number, thickness: number, y: number, coord: Rect, color: string }
type StretchShape = (box: StretchBox) => Element[]

// stroke attrs for the pieces; `coord` goes only on the point-based elements
// (Line, Arrow), since ArrowHead and Arc draw in their own unit box and are
// positioned by pos/size within the parent's coord
function stretch_stroke_attr({ thickness, color }: StretchBox): Attrs {
    return { stroke: color, stroke_width: thickness, stroke_linecap: 'round', stroke_linejoin: 'round' }
}

// arrows: a stem (one rule, or two for the double forms) with open barbed heads
// at either end. `heads` draws a second chevron behind the first for
// \twoheadrightarrow; `barb` keeps one barb for the harpoons
type ArrowSpec = { left?: boolean, right?: boolean, lines?: number, heads?: number, barb?: 'both' | 'up' | 'down' }

function stretch_arrow({ left = false, right = false, lines = 1, heads = 1, barb = 'both' }: ArrowSpec): StretchShape {
    return box => {
        const { width, height, thickness: t, y, coord } = box
        const mid = y + 0.5 * height
        const size = stretch_head_size(height, t)
        const depth = 0.5 * size * Math.cos(0.5 * d2r * STRETCH_ARC)  // barb reach back from the tip
        const attr = stretch_stroke_attr(box)

        // a harpoon keeps the upper or lower barb, which is the head's left or
        // right barb depending on which way it points
        const end_barb = barb == 'both' ? 'both' : barb == 'up' ? 'left' : 'right'
        const start_barb = barb == 'both' ? 'both' : barb == 'up' ? 'right' : 'left'
        const head_attr = { arrow_size: size, arrow_arc: STRETCH_ARC, arrow_curve: STRETCH_CURVE, arrow_exact: true, start_barb, end_barb }

        const out: Element[] = []
        if (lines == 1) {
            // a single stem runs to the tip and the barbs open from it
            out.push(new Arrow({ points: [ [ 0, mid ], [ width, mid ] ], arrow_start: left, arrow_end: right, coord, ...head_attr, ...attr }))
        } else {
            // two stems straddle the centerline and stop where they meet the
            // barbs, as in \Rightarrow; the head is placed on its own
            const gap = 0.5 * STRETCH_LINE_GAP
            const inset = gap / Math.tan(0.5 * d2r * STRETCH_ARC)
            const [ x0, x1 ] = [ left ? inset : 0.5 * t, right ? width - inset : width - 0.5 * t ]
            for (const dy of [ -gap, gap ]) out.push(new Line({ points: [ [ x0, mid + dy ], [ x1, mid + dy ] ], coord, ...attr }))
            if (right) out.push(new ArrowHead({ angle: 0, pos: [ width, mid ], size, arc: STRETCH_ARC, curve: STRETCH_CURVE, barb: end_barb, ...attr }))
            if (left) out.push(new ArrowHead({ angle: 180, pos: [ 0, mid ], size, arc: STRETCH_ARC, curve: STRETCH_CURVE, barb: start_barb, ...attr }))
        }

        // extra chevrons sit a bit behind the first
        for (const i of range(1, heads)) {
            const back = 0.6 * depth * i
            if (right) out.push(new ArrowHead({ angle: 0, pos: [ width - back, mid ], size, arc: STRETCH_ARC, curve: STRETCH_CURVE, barb: end_barb, ...attr }))
            if (left) out.push(new ArrowHead({ angle: 180, pos: [ back, mid ], size, arc: STRETCH_ARC, curve: STRETCH_CURVE, barb: start_barb, ...attr }))
        }
        return out
    }
}

// \hookrightarrow: the tail is a half circle sitting above the stem and opening
// toward the head -- like a ⊂ whose lower arm runs on as the stem and whose
// upper arm is the free end -- so it is centred half its height above the line
function stretch_hook_arrow(side: 'left' | 'right'): StretchShape {
    return box => {
        const { width, height, thickness: t, y, coord } = box
        const mid = y + 0.5 * height
        const r = 0.25 * height
        const attr = stretch_stroke_attr(box)
        const [ cx, start, end ] = side == 'left' ? [ r, 90, 270 ] : [ width - r, -90, 90 ]
        const hook = new Arc({ pos: [ cx, mid - r ], rad: r - 0.5 * t, start, end, ...attr })
        const arrow = new Arrow({
            points: side == 'left' ? [ [ r, mid ], [ width, mid ] ] : [ [ width - r, mid ], [ 0, mid ] ],
            arrow_size: stretch_head_size(height, t), arrow_arc: STRETCH_ARC, arrow_curve: STRETCH_CURVE, arrow_exact: true, coord, ...attr,
        })
        return [ hook, arrow ]
    }
}

// \mapsto's stem is stopped by a full-height bar at its tail
function stretch_mapsto(side: 'left' | 'right'): StretchShape {
    const arrow = stretch_arrow({ right: side == 'left', left: side == 'right' })
    return box => {
        const { width, height, thickness: t, y } = box
        const x = side == 'left' ? 0.5 * t : width - 0.5 * t
        return [ ...arrow(box), new Line({ points: [ [ x, y + 0.5 * t ], [ x, y + height - 0.5 * t ] ], coord: box.coord, ...stretch_stroke_attr(box) }) ]
    }
}

// \overlinesegment and \underlinesegment are the same shape: a rule through
// the middle of the box with a tick at each end reaching 0.167 em above and
// below it (katex's path is a 0.04 em bar at y = 241..281 of 522 with ticks
// spanning 94..428), so the ticks are centred on the bar, not hanging from it
const SEGMENT_TICK = 0.167

function stretch_segment(): StretchShape {
    return box => {
        const { width, height, thickness: t, y, coord } = box
        const attr = { coord, ...stretch_stroke_attr(box) }
        const mid = y + 0.5 * height
        const [ yt, yb ] = [ mid - SEGMENT_TICK, mid + SEGMENT_TICK ]
        return [
            new Line({ points: [ [ 0.5 * t, mid ], [ width - 0.5 * t, mid ] ], ...attr }),
            new Line({ points: [ [ 0.5 * t, yt ], [ 0.5 * t, yb ] ], ...attr }),
            new Line({ points: [ [ width - 0.5 * t, yt ], [ width - 0.5 * t, yb ] ], ...attr }),
        ]
    }
}

// two arrows stacked in one box, as in \rightleftharpoons
function stretch_pair(top: ArrowSpec, bottom: ArrowSpec): StretchShape {
    return box => {
        const half = 0.5 * box.height
        return [
            ...stretch_arrow(top)({ ...box, height: half }),
            ...stretch_arrow(bottom)({ ...box, height: half, y: box.y + half }),
        ]
    }
}

// the filled outlines: a centerline traced both ways along its normals
function stretch_arc(cx: number, cy: number, r: number, a0: number, a1: number): Point[] {
    return range(STRETCH_SAMPLES + 1).map(i => {
        const a = d2r * (a0 + (a1 - a0) * (i / STRETCH_SAMPLES))
        return [ cx + r * Math.cos(a), cy + r * Math.sin(a) ] as Point
    })
}

function stretch_stroke(points: Point[], thickness: number): Point[] {
    return [ ...offset_polyline(points, 0.5 * thickness), ...offset_polyline(points, -0.5 * thickness).reverse() ]
}

function stretch_filled(outline: (width: number, height: number, t: number) => Point[][]): StretchShape {
    return ({ width, height, thickness, coord, color }) =>
        outline(width, height, thickness).map(points => new Polygon({ points, coord, fill: color, stroke: none }))
}

// \overgroup: a run with a hook sweeping down at each end, like a brace with
// no peak. The hooks are quarter ellipses, wider than they are deep, so the
// shape reads as a shallow sweep rather than a narrow U (neither katex's nor
// LaTeX's exact form, which differ from each other)
const GROUP_SWEEP = 1.8  // hook width per depth

function stretch_group(width: number, height: number, t: number): Point[][] {
    const ry = Math.max(height - t, 0)
    const rx = Math.max(Math.min(GROUP_SWEEP * ry, 0.5 * (width - t)), 0)
    const [ x0, y0 ] = [ 0.5 * t, 0.5 * t ]
    const arc = (cx: number, a0: number, a1: number) => range(STRETCH_SAMPLES + 1).map(i => {
        const a = d2r * (a0 + (a1 - a0) * (i / STRETCH_SAMPLES))
        return [ x0 + cx + rx * Math.cos(a), y0 + ry + ry * Math.sin(a) ] as Point
    })
    const line = [ ...arc(rx, 180, 270), ...arc(width - t - rx, 270, 360) ]
    return [ stretch_stroke(line, t) ]
}

// \utilde's stretchy tilde: one period of a sine, flattened to the box
function stretch_tilde(width: number, height: number, t: number): Point[][] {
    const amp = 0.5 * (height - t)
    const line = range(4 * STRETCH_SAMPLES + 1).map(i => {
        const f = i / (4 * STRETCH_SAMPLES)
        return [ f * width, 0.5 * height - amp * Math.sin(2 * Math.PI * f) ] as Point
    })
    return [ stretch_stroke(line, t) ]
}

function stretch_brace(over: boolean): (width: number, height: number, t: number) => Point[][] {
    return (width, height, t) => {
        const outline = brace_outline(width, height, BRACE_THICKNESS, BRACE_THIN)
        return [ over ? outline : outline.map(([ x, y ]) => [ x, height - y ] as Point) ]
    }
}

const stretch_flip = (fn: (w: number, h: number, t: number) => Point[][]) =>
    (w: number, h: number, t: number) => fn(w, h, t).map(p => p.map(([ x, y ]) => [ x, h - y ] as Point))

// keyed by katex's stretchy label; height and min_width are its katexImagesData
type StretchEntry = { shape: StretchShape, height: number, min_width: number }

const ARROW_H = 0.522, DOUBLE_H = 0.56, FLAT_H = 0.334, GROUP_H = 0.26, PAIR_H = 0.716  // GROUP_H is shallower than katex's 0.342 by choice
const STRETCH: Record<string, StretchEntry> = {
    overrightarrow:      { shape: stretch_arrow({ right: true }), height: ARROW_H, min_width: 0.888 },
    overleftarrow:       { shape: stretch_arrow({ left: true }), height: ARROW_H, min_width: 0.888 },
    underrightarrow:     { shape: stretch_arrow({ right: true }), height: ARROW_H, min_width: 0.888 },
    underleftarrow:      { shape: stretch_arrow({ left: true }), height: ARROW_H, min_width: 0.888 },
    overleftrightarrow:  { shape: stretch_arrow({ left: true, right: true }), height: ARROW_H, min_width: 0.888 },
    underleftrightarrow: { shape: stretch_arrow({ left: true, right: true }), height: ARROW_H, min_width: 0.888 },
    Overrightarrow:      { shape: stretch_arrow({ right: true, lines: 2 }), height: DOUBLE_H, min_width: 0.888 },
    overleftharpoon:     { shape: stretch_arrow({ left: true, barb: 'up' }), height: ARROW_H, min_width: 0.888 },
    overrightharpoon:    { shape: stretch_arrow({ right: true, barb: 'up' }), height: ARROW_H, min_width: 0.888 },
    overlinesegment:     { shape: stretch_segment(), height: ARROW_H, min_width: 0.888 },
    underlinesegment:    { shape: stretch_segment(), height: ARROW_H, min_width: 0.888 },
    overgroup:           { shape: stretch_filled(stretch_group), height: GROUP_H, min_width: 0.888 },
    undergroup:          { shape: stretch_filled(stretch_flip(stretch_group)), height: GROUP_H, min_width: 0.888 },
    utilde:              { shape: stretch_filled(stretch_tilde), height: 0.26, min_width: 0 },
    overbrace:           { shape: stretch_filled(stretch_brace(true)), height: BRACE_HEIGHT, min_width: BRACE_MIN_WIDTH },
    underbrace:          { shape: stretch_filled(stretch_brace(false)), height: BRACE_HEIGHT, min_width: BRACE_MIN_WIDTH },

    xrightarrow:         { shape: stretch_arrow({ right: true }), height: ARROW_H, min_width: 1.469 },
    xleftarrow:          { shape: stretch_arrow({ left: true }), height: ARROW_H, min_width: 1.469 },
    xleftrightarrow:     { shape: stretch_arrow({ left: true, right: true }), height: ARROW_H, min_width: 1.75 },
    xRightarrow:         { shape: stretch_arrow({ right: true, lines: 2 }), height: DOUBLE_H, min_width: 1.526 },
    xLeftarrow:          { shape: stretch_arrow({ left: true, lines: 2 }), height: DOUBLE_H, min_width: 1.526 },
    xLeftrightarrow:     { shape: stretch_arrow({ left: true, right: true, lines: 2 }), height: DOUBLE_H, min_width: 1.75 },
    xlongequal:          { shape: stretch_arrow({ lines: 2 }), height: FLAT_H, min_width: 0.888 },
    xtwoheadrightarrow:  { shape: stretch_arrow({ right: true, heads: 2 }), height: FLAT_H, min_width: 0.888 },
    xtwoheadleftarrow:   { shape: stretch_arrow({ left: true, heads: 2 }), height: FLAT_H, min_width: 0.888 },
    xrightharpoonup:     { shape: stretch_arrow({ right: true, barb: 'up' }), height: ARROW_H, min_width: 0.888 },
    xrightharpoondown:   { shape: stretch_arrow({ right: true, barb: 'down' }), height: ARROW_H, min_width: 0.888 },
    xleftharpoonup:      { shape: stretch_arrow({ left: true, barb: 'up' }), height: ARROW_H, min_width: 0.888 },
    xleftharpoondown:    { shape: stretch_arrow({ left: true, barb: 'down' }), height: ARROW_H, min_width: 0.888 },
    xhookrightarrow:     { shape: stretch_hook_arrow('left'), height: ARROW_H, min_width: 1.08 },
    xhookleftarrow:      { shape: stretch_hook_arrow('right'), height: ARROW_H, min_width: 1.08 },
    xmapsto:             { shape: stretch_mapsto('left'), height: ARROW_H, min_width: 1.5 },
    xrightleftharpoons:  { shape: stretch_pair({ right: true, barb: 'up' }, { left: true, barb: 'down' }), height: PAIR_H, min_width: 1.75 },
    xleftrightharpoons:  { shape: stretch_pair({ left: true, barb: 'up' }, { right: true, barb: 'down' }), height: PAIR_H, min_width: 1.75 },
    xrightleftarrows:    { shape: stretch_pair({ right: true }, { left: true }), height: 0.901, min_width: 1.75 },
    xtofrom:             { shape: stretch_pair({ right: true }, { left: true }), height: 0.528, min_width: 1.75 },
}

function stretch_entry(label: string): StretchEntry | undefined {
    return STRETCH[label.replace(/^\\/, '')]
}

interface MathStretchArgs extends GroupArgs {
    label?: string
    advance?: number
    height?: number
    thickness?: number
    fill?: string
}

class MathStretch extends Group {
    math: MathSpec

    constructor(args: MathStretchArgs = {}) {
        const { label = 'overbrace', advance: advance0, height: height0, thickness = STRETCH_THICKNESS, fill = black, ...attr } = THEME(args, 'MathStretch')
        const entry = stretch_entry(label)
        if (entry == null) {
            throw new Error(`Unknown stretchy decoration: '${label}'`)
        }

        // the shape draws into a box of its natural height and at least its
        // natural width, so a decoration over a narrow body keeps its form
        const height = Math.max(height0 ?? entry.height, 2 * thickness)
        const advance = Math.max(advance0 ?? entry.min_width, entry.min_width, 2 * thickness)

        // compute layout metrics
        const metrics: InlineMetrics = { advance, vrange: [ 0, height ], vanchor: 0 }
        const coord: Rect = [ 0, 0, advance, height ]

        // the children draw in em within this coord (a Polygon maps its points
        // through its own context, so each piece needs the coord explicitly)
        const children = entry.shape({ width: advance, height, thickness, y: 0, coord, color: fill })

        // pass to Group
        super({ children, coord, aspect: metrics_aspect(metrics), ...attr })
        this.args = args
        this.math = make_math({ left: 'mord', right: 'mord', ...metrics })
    }

    // strokes in here are given in em: rebase the stroke unit to this box's
    // pixels per em, so the rules and arrowheads scale with the math around them
    inner(ctx: Context): string {
        return super.inner(ctx.clone({ unit: Math.abs(ctx.resizex(1, false)) }))
    }
}

interface HorizBraceArgs extends Omit<GroupArgs, 'children'> {
    children?: MathLeaf[]
    label?: WithMath | null
    over?: boolean
    style?: MathStyle
    height?: number
    thickness?: number
}

class HorizBrace extends Group {
    math: MathSpec

    constructor(args: HorizBraceArgs = {}) {
        const {
            children, label = null, over = true, style = 'text',
            height = BRACE_HEIGHT, thickness = BRACE_THICKNESS, ...attr0
        } = THEME(args, 'HorizBrace')
        const child = check_singleton(children)
        const [ spec, attr ] = spec_split(attr0)

        // TeX sets the braced body in display style, so operators take limits
        // and fractions stay full size
        const body = normalize_math_leaf(child, is_script_style(style) ? style : 'display')
        if (body == null) {
            throw new Error('HorizBrace must have exactly one child')
        }

        // the body sets the brace width, down to a floor that keeps a brace over
        // a narrow body from collapsing into a squiggle; a wider label overhangs
        const width0 = Math.max(body.math.advance, BRACE_MIN_WIDTH)
        const brace = new MathBrace({ advance: width0, height, thickness, over, ...attr })
        const items = [ body, brace, label ].filter(item => item != null)
        const width = max(items.map(item => item.math.advance)) ?? 0

        // stack outward from the body, whose anchor the whole group keeps
        const [ blo, bhi ] = metrics_bounds(body.math)
        const edge = over ? blo - BRACE_KERN - height : bhi + BRACE_KERN
        const placed: Placed[] = [
            { item: body, x: 0, y: 0, width, align: 'center' },
            { item: brace, x: 0, y: edge, width, align: 'center' },
        ]
        if (label != null) {
            const [ llo, lhi ] = metrics_bounds(label.math)
            const y = over
                ? edge - BRACE_LABEL_KERN - lhi
                : edge + height + BRACE_LABEL_KERN - llo
            placed.push({ item: label, x: 0, y, width, align: 'center' })
        }

        // an over/underbrace is an inner atom
        const group = place_items(placed, [ 0, 0 ], 'minner')
        super({ children: group.children, coord: group.spec.coord, aspect: group.spec.aspect, ...spec })
        this.args = args
        this.math = group.math
    }
}

//
// math text
//

interface MathTextArgs extends GroupArgs {
    spacing?: number
    style?: MathStyle
    strut?: boolean
}

type MathLeaf = Element | string | number | boolean | null | undefined

// parse a TeX string into math elements in the given style, rendering the raw
// text in red on a parse error (as Latex does)
function parse_math(tex: string, attr: Attrs = {}, style: MathStyle = 'display'): WithMath {
    try {
        // the AMS multiline environments (align, gather, equation, ...) are
        // gated on display mode in katex's parser
        const tree = parse_tex(tex, { displayMode: style_size(style) == 'display' })
        return convert_tree(tree, attr, style)
    } catch (e) {
        // a strict failure from convert_tree is already reported; don't re-wrap
        // it as a parse error on the way out
        if (e instanceof StrictError) throw e
        strictError('parse', `${(e as Error).message.split('\n')[0]}`)
        return new MathSpan({ children: [ tex ], color: red, font_family: 'KaTeX_Main' })
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
        const { children: children0, style = 'text', strut = false, ...attr } = THEME(args, 'MathText')
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
// (its baseline sits MATH_AXIS * scale below its anchor); defaults to the scale
// the item carries, which is what scale_math left on it
function baseline_extents(item: WithMath, scale: number = item.math.scale): [ number, number ] {
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
        const p = style == 'display' ? TEX.sup1 : is_cramped_style(style) ? TEX.sup3 : TEX.sup2
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

interface SupSubArgs extends MathRowArgs {
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

        // scripts render one size level down; superscripts inherit crampedness
        // while subscripts are always cramped (TeX's eight-style transition table)
        const supStyle = sup_style(style)
        const subStyle = sub_style(style)
        const rel = relative_scale(style, supStyle)
        const subRel = relative_scale(style, subStyle)
        const sup0m = normalize_math_leaf(sup0, supStyle)
        const sub0m = normalize_math_leaf(sub0, subStyle)
        const sup = sup0m != null ? scale_math(sup0m, rel) : null
        const sub = sub0m != null ? scale_math(sub0m, subRel) : null

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
        const { children: children0, has_bar = true, padding = [ 0.1, 0 ], rule_size = TEX.frac_rule, style = 'display', ...attr } = THEME(args, 'Frac')
        const [ numer0, denom0 ] = check_array(children0, 2)
        const [ pad_x, pad_y ] = inline_padding(padding)
        const nstyle = frac_num_style(style)
        const dstyle = frac_den_style(style)
        const numer1 = normalize_math_leaf(numer0, nstyle)
        const denom1 = normalize_math_leaf(denom0, dstyle)

        // check children
        if (numer1 == null || denom1 == null) {
            throw new Error('Frac must have exactly two children')
        }

        // fraction contents render one style level down in inline styles
        const rel = relative_scale(style, nstyle)
        const drel = relative_scale(style, dstyle)
        const numer = scale_math(numer1, rel)
        const denom = scale_math(denom1, drel)

        // style parameters: baseline shifts and clearance from the bar
        const display = style_size(style) == 'display'
        const numShift = display ? (has_bar ? TEX.num1 : TEX.num3) : TEX.num2
        const denShift = display ? TEX.denom1 : TEX.denom2
        const rule_spacing = has_bar ? rule_size : TEX.rule
        const clearance = (has_bar ? (display ? 3 : 1) : (display ? 7 : 3)) * rule_spacing + pad_y
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
// over/underline
//

interface LineDecorationArgs extends GroupArgs {
    thickness?: number
    color?: string
    style?: MathStyle
}

type LineDecorationSide = 'over' | 'under'

function layout_line_decoration(body: WithMath, side: LineDecorationSide, thickness: number, color?: string): WithMath<Group> {
    const [ top, bottom ] = metrics_bounds(body.math)
    const edge = side == 'over' ? top : bottom
    const direction = side == 'over' ? -1 : 1
    const rule = new MathRule({
        advance: body.math.advance,
        thickness,
        ...(color != null ? { fill: color } : {}),
    })
    const line_anchor = edge + direction * 3.5 * thickness
    const padding: Limit = side == 'over' ? [ thickness, 0 ] : [ 0, thickness ]
    return place_items([
        { item: body, x: 0, y: 0 },
        { item: rule, x: 0, y: line_anchor },
    ], padding, 'mord')
}

// TeX Rule 10: keep the body's baseline and top fixed, then place a rule
// below its ink with a three-rule gap and one extra rule of trailing depth.
class Underline extends Group {
    math: MathSpec

    constructor(args: LineDecorationArgs = {}) {
        const { children, thickness = TEX.rule, color, style = 'text', ...attr } = THEME(args, 'Underline')
        const child = check_singleton(children)
        const body = normalize_math_leaf(child, style)

        if (body == null) {
            throw new Error('Underline must have exactly one child')
        }

        const underlined = layout_line_decoration(body, 'under', thickness, color)

        const { coord, aspect } = underlined.spec
        super({ children: underlined.children, coord, aspect, ...attr })
        this.args = args
        this.math = underlined.math
    }
}

// TeX Rule 9 mirrors underline above the body, but first lays out the body in
// the cramped version of the surrounding style.
class Overline extends Group {
    math: MathSpec

    constructor(args: LineDecorationArgs = {}) {
        const { children, thickness = TEX.rule, color, style = 'text', ...attr } = THEME(args, 'Overline')
        const child = check_singleton(children)
        const body = normalize_math_leaf(child, cramped_style(style))

        if (body == null) {
            throw new Error('Overline must have exactly one child')
        }

        const overlined = layout_line_decoration(body, 'over', thickness, color)
        const { coord, aspect } = overlined.spec
        super({ children: overlined.children, coord, aspect, ...attr })
        this.args = args
        this.math = overlined.math
    }
}

//
// sqrt
//

interface SqrtArgs extends GroupArgs {
    index?: Element | null
    padding?: Padding
    rule_size?: number
    line_width?: number
    style?: MathStyle
}

const RADICAL_FONTS: FontFamily[] = [
    'KaTeX_Main',
    'KaTeX_Size1',
    'KaTeX_Size2',
    'KaTeX_Size3',
    'KaTeX_Size4',
]

interface RadicalSpanArgs extends MathSpanArgs {
    fit_width?: boolean
    fit_aspect?: number
}

// SVG text normally scales uniformly with its font size. The tall fallback
// needs KaTeX's behavior instead: grow vertically while retaining the Size4
// surd's advance. textLength constrains that one exceptional glyph's width.
class RadicalSpan extends MathSpan {
    fit_width: boolean

    constructor(args: RadicalSpanArgs = {}) {
        const { fit_width = false, fit_aspect, ...attr } = args
        super(attr)
        this.args = args
        this.fit_width = fit_width
        if (fit_aspect != null) {
            this.spec.aspect = fit_aspect
            this.spec.aspect0 = fit_aspect
        }
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        if (!this.fit_width) return attr
        const [ x1, , x2 ] = ctx.prect
        return {
            ...attr,
            textLength: Math.abs(x2 - x1),
            lengthAdjust: 'spacingAndGlyphs',
        }
    }
}

function radical_glyph(font_family: FontFamily, color: string | undefined): WithMath<RadicalSpan> {
    return new RadicalSpan({
        children: [ '\u221a' ],
        font_family,
        center: true,
        ...(color != null ? { color } : {}),
    })
}

// Pick the first natural KaTeX surd that covers the requested height. Beyond
// Size4, keep its TeX-like horizontal proportions and stretch only vertically;
// this is the same role played by KaTeX's tall-radical SVG fallback.
function fit_radical(height: number, color: string | undefined): WithMath<RadicalSpan> {
    let glyph = radical_glyph(RADICAL_FONTS[0], color)

    for (const font of RADICAL_FONTS) {
        glyph = radical_glyph(font, color)
        if (metrics_height(glyph.math) >= height) return glyph
    }

    const naturalHeight = metrics_height(glyph.math)
    const scale = height / naturalHeight
    const [ lo, hi ] = metrics_bounds(glyph.math)
    const aspect = glyph.math.advance / height
    const fitted = glyph.clone({ fit_width: true, fit_aspect: aspect }) as RadicalSpan
    const stretched = with_math(fitted, {
        vrange: [ scale * lo, scale * hi ],
        vanchor: 0,
    })
    return stretched
}

class Sqrt extends Group {
    math: MathSpec

    constructor(args: SqrtArgs = {}) {
        const {
            children,
            index = null,
            color,
            padding = 0,
            rule_size: ruleSize0,
            line_width: lineWidth,
            style = 'text',
            ...attr
        } = THEME(args, 'Sqrt')
        const child = check_singleton(children)
        const body = normalize_math_leaf(child, cramped_style(style))
        const ruleSize = ruleSize0 ?? lineWidth ?? TEX.rule

        // check child
        if (body == null) {
            throw new Error('Sqrt must have exactly one child')
        }

        // TeX Rule 11: the radicand is cramped, with a style-dependent gap
        // below the rule. The smallest delimiter is still a full text surd.
        const bodyBox = new MathBox({ children: [ body ], padding })
        const bodyHeight = metrics_height(bodyBox.math)
        const bodyWidth = bodyBox.math.advance
        const phi = style_size(style) == 'display' ? TEX.x_height : ruleSize
        let clearance = ruleSize + 0.25 * phi
        const effectiveBodyHeight = Math.max(bodyHeight, TEX.x_height)
        const minRadicalHeight = effectiveBodyHeight + clearance + ruleSize
        const radical = fit_radical(minRadicalHeight, color)
        const radicalHeight = metrics_height(radical.math)

        // A natural delimiter is often taller than the minimum. Split that
        // extra room above and below the body, as TeX/KaTeX do.
        const radicalDepth = radicalHeight - ruleSize
        if (radicalDepth > effectiveBodyHeight + clearance) {
            clearance = 0.5 * (clearance + radicalDepth - effectiveBodyHeight)
        }

        // Preserve the body's anchor. The surd and the square rule meet with a
        // small overlap so rasterization cannot open a seam at their joint.
        const [ bodyTop ] = metrics_bounds(bodyBox.math)
        const ruleTop = bodyTop - clearance - ruleSize
        const [ radicalTop ] = metrics_bounds(radical.math)
        const radicalY = ruleTop - radicalTop
        const radicalWidth = radical.math.advance
        const overlap = Math.min(0.5 * ruleSize, radicalWidth)
        const rule = new MathRule({
            advance: overlap + bodyWidth,
            thickness: ruleSize,
            rounded: [ 0.5, 0, 0, 0.5 ],
            ...(color != null ? { fill: color } : {}),
        })
        const [ ruleLo ] = metrics_bounds(rule.math)
        const ruleY = ruleTop - ruleLo

        const placed: Placed[] = [
            { item: radical, x: 0, y: radicalY },
            { item: rule, x: radicalWidth - overlap, y: ruleY },
            { item: bodyBox, x: radicalWidth, y: 0 },
        ]

        // TeX always sets a root index in scriptscript style. Keep it inside
        // the surd's horizontal advance, aligned with the upper-left shoulder.
        if (index != null) {
            const index0 = ensure_math(index)
            const indexElem = scale_math(index0, relative_scale(style, 'scriptscript'))
            const [ , indexBottom ] = metrics_bounds(indexElem.math)
            const right = 0.65 * radicalWidth
            const bottom = ruleTop + 0.55 * radicalHeight
            placed.push({
                item: indexElem,
                x: Math.max(0, right - indexElem.math.advance),
                y: bottom - indexBottom,
            })
        }

        const root = place_items(placed, [ 0, 0 ], 'mord')
        const { coord, aspect } = root.spec

        // pass to Group
        super({ children: root.children, coord, aspect, ...attr })
        this.args = args

        // set math metrics
        this.math = root.math
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

    // the size fonts do not all cover every delimiter -- the vertical bars stop
    // after Size1, since real TeX builds tall ones from extensible pieces --
    // so skip any size that would render .notdef and stretch the largest that
    // does have the glyph
    // TeX (and katex's traverseSequence) walk the sizes from smallest and take
    // the first whose natural extent covers the requirement, so delimiters
    // overshoot rather than being scaled -- a stretched glyph also thickens.
    // Only when even the largest size is too small (where TeX would build the
    // delimiter from extensible pieces) is that glyph stretched to fit
    const text = get_delim_text(delim, side)
    let largest: Delim | null = null
    for (let level = 1; level <= DELIM_LEVELS; level++) {
        if (!textHasGlyphs(text, { font_family: delimiter_font(level) })) continue
        const candidate = new Delim({ delim, side, level, ...attr })
        const [ lo, hi ] = metrics_bounds(candidate.math)
        if (0.5 * (hi - lo) >= target) return candidate as WithMath<Delim>
        largest = candidate
    }
    if (largest == null) return new Delim({ delim, side, level: 1, ...attr }) as WithMath<Delim>

    const [ lo, hi ] = metrics_bounds(largest.math)
    return scale_math(largest, target / (0.5 * (hi - lo)))
}

interface BracketArgs extends MathRowArgs {
    delim?: DelimType | [ DelimType, DelimType ]
    left_delim?: string | null
    right_delim?: string | null
    height?: number  // fixed total delimiter height in em instead of fitting the body (TeX rule 15e, for \binom and \genfrac)
}

class Bracket extends MathRow {
    constructor(args: BracketArgs = {}) {
        const { children: children0, delim: delim0 = 'round', left_delim: leftDelim0, right_delim: rightDelim0, height, ...attr0 } = THEME(args, 'Bracket')
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

        // required half-height around the axis: from the body (TeX Rule 19), or
        // a fixed size that ignores the body (Rule 15e, generalized fractions)
        const [ blo, bhi ] = metrics_bounds(body.math)
        const extent = Math.max(-blo, bhi)
        const target = height != null ? 0.5 * height : Math.max(DELIM_FACTOR * extent, extent - 0.5 * DELIM_SHORTFALL, 0.5)

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

// \operatorname{...}: the body is set upright, the way the built-in named
// operators are, and the whole name behaves as a single Op atom
function convert_operatorname(tree: TreeOperatorName, attr: Attrs, style: MathStyle): WithMath {
    const { body } = tree

    // katex rewrites each character as an upright text-mode symbol, and amsopn
    // asks for a hyphen rather than a minus and an asterisk rather than \ast
    const upright = (body ?? []).map(node => {
        const text = is_object(node) && 'text' in node ? (node as { text?: unknown }).text : undefined
        return is_string(text)
            ? { type: 'textord', mode: 'text', text: text.replace(/\u2212/, '-').replace(/\u2217/, '*') } as TreeNode
            : node
    })
    // katex builds the body withFont("mathrm"); force the upright face here so
    // a nested group (\varlimsup wraps its name in \overline) stays upright too
    const inner = seal_math(convert_tree(upright, { ...attr, font_family: SYMBOL_MODE_FONT.text }, style))
    return with_math(inner, { left: 'mop', right: 'mop' })
}

// a stretchy decoration sitting on the body, which sets its width: the body
// keeps its own baseline and the decoration is centred over (or under) it
function place_stretch(body: WithMath, label: string, over: boolean, kern: number, attr: Attrs): WithMath<Group> {
    const deco = new MathStretch({ label, advance: body.math.advance, ...attr })
    const [ blo, bhi ] = metrics_bounds(body.math)
    const height = metrics_height(deco.math)
    const width = max([ body.math.advance, deco.math.advance ]) ?? 0
    const y = over ? blo - kern - height : bhi + kern
    return place_items([
        { item: body, x: 0, y: 0, width, align: 'center' },
        { item: deco, x: 0, y, width, align: 'center' },
    ], [ 0, 0 ], 'mord')
}

// \xrightarrow and friends: the arrow is the base, sitting on the math axis,
// with its labels riding at script size just clear of it
const XARROW_KERN = 0.111  // 2 mu between the arrow and its labels, from amsmath
const XARROW_PAD = 0.5     // beside the labels: katex's .x-arrow-pad is 0.5em a side

function convert_xarrow(tree: TreeXArrow, attr: Attrs, style: MathStyle): WithMath {
    const { label, body: body0, below: below0 } = tree
    const up_style = sup_style(style)
    const down_style = sub_style(style)
    const above = scale_math(convert_tree(body0, attr, up_style), relative_scale(style, up_style))
    const below = below0 != null
        ? scale_math(convert_tree(below0, attr, down_style), relative_scale(style, down_style))
        : null

    const wide = max([ above.math.advance, below?.math.advance ?? 0 ]) ?? 0
    const arrow = new MathStretch({ label, advance: wide + 2 * XARROW_PAD, ...attr })
    const height = metrics_height(arrow.math)
    const width = max([ arrow.math.advance, wide ]) ?? 0

    // the arrow straddles the axis, which is where the anchor already sits
    const placed: Placed[] = [ { item: arrow, x: 0, y: -0.5 * height, width, align: 'center' } ]

    // the label above hangs from its baseline, so an ordinary descender drops
    // into the gap; only a deep one is pushed clear (amsmath's rule)
    const [ , depth ] = baseline_extents(above)
    const drop = depth > 0.25 ? depth : 0
    const base_y = -0.5 * height - XARROW_KERN - drop
    placed.push({ item: above, x: 0, y: base_y - MATH_AXIS * above.math.scale, width, align: 'center' })
    if (below != null) {
        const [ llo ] = metrics_bounds(below.math)
        placed.push({ item: below, x: 0, y: 0.5 * height + XARROW_KERN - llo, width, align: 'center' })
    }
    return place_items(placed, [ 0, 0 ], 'mrel')
}

// \overbrace and \underbrace, with the script that may be wrapped around them:
// LaTeX passes the brace like an operator with \limits, so a sup on an
// overbrace (or a sub on an underbrace) becomes the brace's label rather than
// an ordinary script
function convert_horiz_brace(tree: TreeHorizBrace, note: TreeNode | null, attr: Attrs, style: MathStyle): WithMath {
    const { isOver, base } = tree

    // the label rides at script size, like the script it was written as
    const note_style = isOver ? sup_style(style) : sub_style(style)
    const label = note != null
        ? scale_math(convert_tree(note, attr, note_style), relative_scale(style, note_style))
        : null

    // TeX sets the braced body in display style, so operators take limits and
    // fractions stay full size
    const body = convert_tree(base, attr, is_script_style(style) ? style : 'display')
    return new HorizBrace({ children: [ body ], label, over: isOver, style, ...attr })
}

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
            const { body, font } = tree
            if (font != null && !TEXT_FONT_NEUTRAL.has(font)) {
                strictError('font', `no font family mapped for '${font}'`)
            }
            return convert_tree(body, attr, style)
        } else if (type == 'font') {
            const { font, body } = tree
            const font_family = TEX_FONT_FAMILY[font]
            if (font_family == null) {
                strictError('font', `no font family mapped for '${font}'`)
            }
            const font_attr = font_family == null ? {} : { font_family }
            return convert_tree(body, { ...attr, ...font_attr }, style)
        } else if (type == 'accent') {
            const { label, base: base0, isStretchy } = tree

            // a stretchy accent has no glyph: it is drawn to the body's width.
            // katex also calls \widehat and \widetilde stretchy, but those do
            // have glyphs, so only take this path for shapes we draw
            if (isStretchy && stretch_entry(label) != null) {
                const body = convert_tree(base0, attr, cramped_style(style))
                return place_stretch(body, label, true, 0, attr)
            }
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

            // a brace swallows the script as its label
            if (base0 != null && is_object(base0) && base0.type == 'horizBrace') {
                return convert_horiz_brace(base0, sup0 ?? sub0 ?? null, attr, style)
            }

            // \operatorname* (and the macros built on it) stacks its scripts as
            // limits, but only in display style, like any other operator
            if (base0 != null && is_object(base0) && base0.type == 'operatorname' && base0.alwaysHandleSupSub) {
                const base = convert_operatorname(base0, attr, style)
                const sup = sup0 ? convert_tree(sup0, attr, sup_style(style)) : null
                const sub = sub0 ? convert_tree(sub0, attr, sub_style(style)) : null
                const limits = style_size(style) == 'display'
                return new SupSub({ children: [ base ], sup, sub, style, limits, ...attr })
            }

            const supStyle = sup_style(style)
            const subStyle = sub_style(style)
            const base = convert_tree(base0, attr, style)
            const sup = sup0 ? convert_tree(sup0, attr, supStyle) : null
            const sub = sub0 ? convert_tree(sub0, attr, subStyle) : null
            return new SupSub({ children: [ base ], sup, sub, style, ...attr })
        } else if (type == 'genfrac') {
            const { mode = 'math', numer: numer0, denom: denom0, hasBarLine = true, leftDelim, rightDelim } = tree
            const numer = convert_tree(numer0, attr, frac_num_style(style))
            const denom = convert_tree(denom0, attr, frac_den_style(style))
            const frac = new Frac({ children: [ numer, denom ], has_bar: hasBarLine, style, ...attr })
            if (leftDelim != null || rightDelim != null) {
                // TeX Rule 15e: a generalized fraction's delimiters have a fixed
                // size by style rather than fitting the body, as in \binom
                const height = style_size(style) == 'display' ? TEX.delim1 : style_size(style) == 'text' ? TEX.delim2 : TEX.delim2_script
                return new Bracket({ children: [ frac ], left_delim: leftDelim, right_delim: rightDelim, height, mode, ...attr })
            }
            return frac
        } else if (type == 'underline') {
            const { body: body0 } = tree
            const body = convert_tree(body0, attr, style)
            return new Underline({ children: [ body ], style, ...attr })
        } else if (type == 'overline') {
            const { body: body0 } = tree
            const body = convert_tree(body0, attr, cramped_style(style))
            return new Overline({ children: [ body ], style, ...attr })
        } else if (type == 'sqrt') {
            const { body: body0, index: index0 } = tree
            const body = convert_tree(body0, attr, cramped_style(style))
            const index = index0 ? convert_tree(index0, attr, 'scriptscript') : null
            return new Sqrt({ children: [ body ], index, style, ...attr })
        } else if (type == 'accentUnder' && stretch_entry(tree.label) != null) {
            const { label, base: base0 } = tree
            const body = convert_tree(base0, attr, style)
            return place_stretch(body, label, false, Math.max(STRETCH_UNDER_KERN, label == '\\utilde' ? 0.12 : 0), attr)
        } else if (type == 'xArrow' && stretch_entry(tree.label) != null) {
            return convert_xarrow(tree, attr, style)
        } else if (type == 'operatorname') {
            return convert_operatorname(tree, attr, style)
        } else if (type == 'horizBrace') {
            return convert_horiz_brace(tree, null, attr, style)
        } else if (type == 'array') {
            const {
                body, cols, arraystretch = 1, addJot, rowGaps, hLinesBeforeRow,
                hskipBeforeAndAfter, colSeparationType,
            } = tree

            // {smallmatrix} separates columns by \thickspace rather than
            // \arraycolsep, measured in the outer em
            const colsep = colSeparationType == 'small'
                ? ARRAY_SMALL_SEP * relative_scale(style, 'script')
                : undefined

            // katex hands cells over already wrapped in the environment's style
            const rows = (body ?? []).map(row => row.map(cell => convert_tree(cell, attr, style)))
            const rowgaps = (rowGaps ?? []).map(gap => gap == null ? null : measurement_to_em(gap))

            return new MathArray({
                children: rows, cols: cols as ArrayCol[] | undefined, stretch: arraystretch,
                jot: addJot, colsep, outer: hskipBeforeAndAfter, hlines: hLinesBeforeRow,
                rowgaps, ...attr,
            })
        } else if (type == 'leftright') {
            const { mode, body: body0, left, right } = tree
            const body = convert_tree(body0, attr, style)
            return new Bracket({ children: [ body ], left_delim: left, right_delim: right, mode, ...attr })
        }
    }

    // fallback
    const type = is_object(tree) ? tree.type : typeof tree
    strictError('node', `unsupported katex node type '${type}'`)
    console.error('Unknown katex tree type:', type)
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
        super({ children: elems, style, strut, ...spec })
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

export { MathSpan, MathSymbol, MathOp, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathArray, MathBrace, HorizBrace, MathText, SupSub, Frac, Underline, Overline, Sqrt, Accent, Bracket, Latex, Tex }
export type { MathClass, MathSpec, MathStyle, InlineMetrics, FontFamily, MathSymbolArgs, MathOpArgs, MathTextArgs }
