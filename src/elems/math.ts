// math components

import { THEME } from '../lib/theme'
import { black, red } from '../lib/const'
import { is_array, is_scalar, is_string, is_boolean, is_object, check_singleton, ensure_singleton, check_array, check_string, rect_box, box_rect, ensure_vector } from '../lib/utils'
import symbols from '../lib/symbols'
import { Context, Element, Group, Rectangle, Spacer, prefix_split, spec_split } from './core'
import { Line } from './geometry'
import { HStack, VStack, Box } from './layout'
import { Span } from './text'
import { __parse as parse_tex } from 'katex'

import type { Padding, Point, Rect, Size, Attrs } from '../lib/types'
import type { BoxArgs, StackArgs } from './layout'
import type { SpanArgs } from './text'
import type { ElementArgs, GroupArgs } from './core'
import type { LineArgs } from './geometry'
import type { Measurement, SymbolMode, SymbolFamily, SymbolFont, SymbolEntry, Tree, TreeNode } from 'katex'

//
// types
//

type FontFamily = 'KaTeX_Math' | 'KaTeX_Main' | 'KaTeX_AMS' | 'KaTeX_Size1' | 'KaTeX_Size2' | 'KaTeX_Size3' | 'KaTeX_Size4'

type AtomClass = 'mord' | 'mop' | 'mbin' | 'mrel' | 'mopen' | 'mclose' | 'mpunct' | 'minner'

type MathSpec = {
    left: AtomClass | null
    right: AtomClass | null
}

type MathElement = Element & {
    math?: Partial<MathSpec>
}

const OP_SYMBOL_FONT: FontFamily = 'KaTeX_Size1'

const SYMBOL_MODE_FONT: Record<SymbolMode, FontFamily> = {
    math: 'KaTeX_Math',
    text: 'KaTeX_Main',
}

const SYMBOL_FAMILY_CLASS: Record<SymbolFamily, AtomClass | null> = {
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
    spacing: null,
}

const THINSPACE: Measurement = { number: 3, unit: 'mu' }
const MEDIUMSPACE: Measurement = { number: 4, unit: 'mu' }
const THICKSPACE: Measurement = { number: 5, unit: 'mu' }

type SpacingTable = Partial<Record<AtomClass, Measurement>>
const SPACING_TABLE: Record<AtomClass, SpacingTable> = {
    mord: { mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mop: { mord: THINSPACE, mop: THINSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mbin: { mord: MEDIUMSPACE, mop: MEDIUMSPACE, mopen: MEDIUMSPACE, minner: MEDIUMSPACE },
    mrel: { mord: THICKSPACE, mop: THICKSPACE, mopen: THICKSPACE, minner: THICKSPACE },
    mopen: {},
    mclose: { mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mpunct: {
        mord: THINSPACE,
        mop: THINSPACE,
        mrel: THICKSPACE,
        mopen: THINSPACE,
        mclose: THINSPACE,
        mpunct: THINSPACE,
        minner: THINSPACE,
    },
    minner: {
        mord: THINSPACE,
        mop: THINSPACE,
        mbin: MEDIUMSPACE,
        mrel: THICKSPACE,
        mopen: THINSPACE,
        mpunct: THINSPACE,
        minner: THINSPACE,
    },
}

//
// math metrics
//

function set_math(element: Element, updates: Partial<MathSpec>): Element {
    const e = element as MathElement
    const { left, right } = updates
    if (e.math == null) e.math = {}
    if (left != null) e.math.left = left
    if (right != null) e.math.right = right
    return e
}

function get_math(element: Element | null): MathSpec {
    const { left = null, right = null } = (element as MathElement)?.math ?? {}
    return { left, right }
}

const EMPTY_MATH = new Spacer()

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

function has_math_metrics(element: Element): boolean {
    const { left, right } = get_math(element)
    return left != null || right != null
}

function inter_atom_spacing(prev: AtomClass | null, next: AtomClass | null): number {
    if (prev == null || next == null) return 0
    const table = SPACING_TABLE[prev]
    const measurement = table?.[next]
    if (measurement == null) return 0
    return measurement_to_em(measurement)
}

function inter_item_spacing(prev: Element | null, next: Element | null, spacing: number): number {
    if (prev == null || next == null) return 0
    if (prev instanceof Spacer || next instanceof Spacer) return 0

    const { right: prevRight } = get_math(prev)
    const { left: nextLeft } = get_math(next)
    const prevIsMath = has_math_metrics(prev)
    const nextIsMath = has_math_metrics(next)

    if (prevIsMath && nextIsMath) return inter_atom_spacing(prevRight, nextLeft)
    return spacing
}

//
// binary atom cancellation
//

const BIN_LEFT_CANCELLER = new Set<AtomClass>(['mbin', 'mopen', 'mrel', 'mop', 'mpunct'])
const BIN_RIGHT_CANCELLER = new Set<AtomClass>(['mrel', 'mclose', 'mpunct'])

function cancel_element_left_bin(element: Element): void {
    const { left, right } = get_math(element)
    if (left != 'mbin') return
    set_math(element, { left: 'mord', right: right == 'mbin' ? 'mord' : right })
}
function cancel_element_right_bin(element: Element): void {
    const { left, right } = get_math(element)
    if (right != 'mbin') return
    set_math(element, { left: left == 'mbin' ? 'mord' : left, right: 'mord' })
}

function cancel_binary_atoms(items0: Element[]): Element[] {
    const items = items0.slice()
    let prevIndex: number | null = null

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const { left, right } = get_math(item)
        if (left == null && right == null) continue

        if (prevIndex == null) {
            cancel_element_left_bin(item)
        } else if (left != null) {
            const prev = items[prevIndex]
            const { right: prevRight } = get_math(prev)

            if (prevRight == 'mbin' && BIN_RIGHT_CANCELLER.has(left)) {
                cancel_element_right_bin(prev)
            }

            const { right: prevClass } = get_math(prev)
            if (left == 'mbin' && (prevClass == null || BIN_LEFT_CANCELLER.has(prevClass))) {
                cancel_element_left_bin(item)
            }
        }

        prevIndex = i
    }

    if (prevIndex != null) {
        cancel_element_right_bin(items[prevIndex])
    }

    return items
}

//
// math span
//

interface MathSpanArgs extends SpanArgs {
    klass?: AtomClass | null
    left?: AtomClass | null
    right?: AtomClass | null
}

class MathSpan extends Span {
    constructor(args: MathSpanArgs = {}) {
        const { children, klass = 'mord', left = klass, right = left, vshift = -0.25, ...attr } = THEME(args, 'MathSpan')
        const text = check_string(children)

        // pass to Span
        super({ children: [ text ], vshift, ...attr })
        this.args = args

        // set math metrics
        set_math(this, { left, right })
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

type MathItem =
    | Element
    | MathText
    | MathSpan
    | string
    | number
    | boolean
    | null
    | undefined
    | MathItem[]

interface MathTextArgs extends Omit<StackArgs, 'children'> {
    children?: MathItem | MathItem[]
    spacing?: number
    inline?: boolean
}

type MathLeaf = Element | string | number | boolean | null

function normalize_math_leaf(child: MathLeaf): Element | null {
    if (child == null) {
        return null
    } else if (child instanceof Element) {
        return child
    } else if (is_scalar(child) || is_string(child) || is_boolean(child)) {
        const text = String(child)
        return new MathSymbol({ children: [ text ] })
    } else {
        throw new Error(`Unknown math leaf type: ${typeof child}`)
    }
}

function normalize_math_children(children0: MathItem | MathItem[]): Element[] {
    const children = is_array(children0) ? children0 : [ children0 ]
    const out: Element[] = []

    for (const child of children) {
        if (child == null) {
            continue
        } else if (is_array(child)) {
            out.push(...normalize_math_children(child))
            continue
        } else if (child instanceof MathText) {
            out.push(...child.children)
            continue
        } else {
            const elem = normalize_math_leaf(child)
            if (elem != null) out.push(elem)
        }
    }

    return out
}

class MathText extends HStack {
    vshift: number

    constructor(args: MathTextArgs = {}) {
        const { children: children0, spacing = 0.25, inline = false, ...attr } = THEME(args, 'MathText')

        // normalize children
        const rawItems = normalize_math_children(children0)
        const items = cancel_binary_atoms(rawItems)
        const children: Element[] = []

        // accumulate math metrics
        let left: AtomClass | null = null
        let right: AtomClass | null = null
        let prevItem: Element | null = null

        // process items
        for (const item of items) {
            const { left: itemLeft, right: itemRight } = get_math(item)
            const gap = inter_item_spacing(prevItem, item, spacing)
            if (gap > 0) children.push(new Spacer({ aspect: gap }))

            children.push(item)

            if (left == null) left = itemLeft
            if (itemRight != null) {
                right = itemRight
            }
            prevItem = item
        }

        // set default right
        if (right == null) right = left

        // pass to HStack
        super({ children, ...attr })
        this.args = args

        // compute combined math metrics
        set_math(this, { left, right })
        this.vshift = inline ? 0.1 : 0
    }

    svg(ctx: Context): string {
        const { prect: prect0 } = ctx
        const [ x, y0, w, h ] = rect_box(prect0, true)
        const y = y0 + this.vshift * h
        const prect = box_rect([x, y, w, h])
        const ctx1 = ctx.clone({ prect })
        return super.svg(ctx1)
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
    constructor(args: SupSubArgs = {}) {
        const { children, sup: sup0 = null, sub: sub0 = null, hspacing = 0.025, vspacing = -0.025, voffset = 0.025, ...attr } = THEME(args, 'SupSub')
        const base = ensure_singleton(children)
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

        // compute combined math metrics
        set_math(this, get_math(base))
    }
}

//
// frac
//

interface FracArgs extends BoxArgs {
    numer?: Element
    denom?: Element
    has_bar?: boolean
    left?: Element | null
    right?: Element | null
    padding?: Padding
    rule_size?: number
}

class Frac extends Box {
    constructor(args: FracArgs = {}) {
        const { children: children0, has_bar = true, left = null, right = null, padding = 0.1, rule_size = 0.005, ...attr } = THEME(args, 'Frac')
        const [ numer, denom ] = check_array(children0, 2)

        // build numer and denom boxes
        const numerBox = new Box({ children: [ numer ], padding })
        const denomBox = new Box({ children: [ denom ], padding })

        // build stack and bar
        const stack = new VStack({ children: [ numerBox, denomBox ], even: true, justify: 'center' })
        const bar = has_bar ? new Rectangle({ fill: black, rad: [ 0.5, rule_size ] }) : null

        // pass to Box
        super({ children: [ stack, bar ], ...attr })
        this.args = args

        // set math metrics
        set_math(this, { left: 'mord', right: 'mord' })
    }
}

interface CoordLineArgs extends LineArgs {
    line_width?: number
}

class CoordLine extends Line {
    line_width: number

    constructor(args: CoordLineArgs = {}) {
        const { line_width = 0.03, ...attr } = args
        super(attr)
        this.args = args
        this.line_width = line_width
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const [ _, stroke_width ] = ctx.mapSize([0, this.line_width])
        return { ...attr, stroke_width: Math.abs(stroke_width) }
    }
}

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

//
// sqrt
//

interface SqrtArgs extends GroupArgs {
    index?: Element | null
    padding?: Padding
}

class Sqrt extends Group {
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
        set_math(this, { left: 'mord', right: 'mord' })
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

function build_accent_symbol(label: string): Element {
    const label1 = ACCENT_LABEL_FALLBACK[label] ?? label
    if (label1 in ACCENT_TEXT_FALLBACK) {
        return new MathSpan({ children: [ ACCENT_TEXT_FALLBACK[label1] ] })
    }
    return new MathSymbol({ children: [ label1 ] })
}

interface AccentArgs extends GroupArgs {
    label?: string
    accent_height?: number
    body_top?: number
}

class Accent extends Box {
    constructor(args: AccentArgs = {}) {
        const { children, label = '', body_top = 0.5, ...attr } = THEME(args, 'Accent')
        const base = check_singleton(children)

        // build accent symbol
        const accent = build_accent_symbol(label)

        // pass to Box
        super({ children: [ base, accent ], ...attr })
        this.args = args

        // set math metrics
        set_math(this, get_math(base))
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

class Bracket extends HStack {
    constructor(args: BracketArgs = {}) {
        const { children: children0, delim: delim0 = 'round', ...attr0 } = THEME(args, 'Bracket')
        const body = check_singleton(children0)
        const [ left_delim, right_delim ] = ensure_vector(delim0, 2)
        const [ delim_attr, attr ] = prefix_split([ 'delim' ], attr0)

        // auto-detect delimiter size
        const left = left_delim != null ? new Delim({ delim: left_delim, side: 'left', ...delim_attr }) : null
        const right = right_delim != null ? new Delim({ delim: right_delim, side: 'right', ...delim_attr }) : null

        // pass to HStack
        super({ children: [ left, body, right ], ...attr })
        this.args = args

        // set math metrics
        set_math(this, { left: 'mord', right: 'mord' })
    }
}

//
// parse katex tree
//

function convert_tree(tree: Tree | TreeNode | null, attr: Attrs = {}): Element {
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
            return new Spacer({ aspect: em })
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
        const elems: Element[] = []
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
export type { AtomClass, MathItem, MathSpec, FontFamily, MathSymbolArgs, MathTextArgs }
