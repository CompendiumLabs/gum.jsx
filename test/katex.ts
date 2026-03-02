import { __parse as parse_tex } from 'katex'
import type { SymbolMode, SymbolFamily, SymbolEntry, Tree, TreeNode } from 'katex'
import symbols from './symbols'
import { is_array, is_object, black, Element, Group, HStack, VStack, Box, Spacer, Rectangle, Span, type Attrs } from '../src/gum'
import { registerFont } from '../src/fonts/fonts'
import { join, resolve } from 'path'

//
// register katex fonts
//

const fonts_dir = resolve(__dirname, '../node_modules/katex/dist/fonts')
await registerFont('KaTeX_Math', join(fonts_dir, 'KaTeX_Math-Italic.ttf'))
await registerFont('KaTeX_Main', join(fonts_dir, 'KaTeX_Main-Regular.ttf'))
await registerFont('KaTeX_AMS', join(fonts_dir, 'KaTeX_AMS-Regular.ttf'))
await registerFont('KaTeX_Size1', join(fonts_dir, 'KaTeX_Size1-Regular.ttf'))

//
// atom classes + spacing data (ported from KaTeX spacingData.js)
//

type AtomClass = 'mord' | 'mop' | 'mbin' | 'mrel' | 'mopen' | 'mclose' | 'mpunct' | 'minner'

type Measurement = {
    number: number
    unit: 'mu'
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

const BIN_LEFT_CANCELLER = new Set<AtomClass>(['mbin', 'mopen', 'mrel', 'mop', 'mpunct'])
const BIN_RIGHT_CANCELLER = new Set<AtomClass>(['mrel', 'mclose', 'mpunct'])

function measurement_to_em(m: Measurement): number {
    // 1mu = 1/18em in TeX; keep it simple here.
    return m.number / 18
}

function inter_atom_spacing(prev: AtomClass | null, next: AtomClass | null): number {
    if (prev == null || next == null) return 0
    const table = SPACING_TABLE[prev]
    const measurement = table?.[next]
    if (measurement == null) return 0
    return measurement_to_em(measurement)
}

interface MathLayout {
    element: Element
    leftClass: AtomClass | null
    rightClass: AtomClass | null
}

const EMPTY_LAYOUT: MathLayout = { element: new Spacer(), leftClass: null, rightClass: null }

function layout_with(element: Element, klass: AtomClass | null): MathLayout {
    return { element, leftClass: klass, rightClass: klass }
}

function layout_from(element: Element, leftClass: AtomClass | null, rightClass: AtomClass | null = leftClass): MathLayout {
    return { element, leftClass, rightClass }
}

function cancel_layout_left_bin(layout: MathLayout): void {
    if (layout.leftClass != 'mbin') return
    layout.leftClass = 'mord'
    if (layout.rightClass == 'mbin') {
        layout.rightClass = 'mord'
    }
}

function cancel_layout_right_bin(layout: MathLayout): void {
    if (layout.rightClass != 'mbin') return
    layout.rightClass = 'mord'
    if (layout.leftClass == 'mbin') {
        layout.leftClass = 'mord'
    }
}

function cancel_binary_atoms(layouts0: MathLayout[]): MathLayout[] {
    const layouts = layouts0.map(layout => ({ ...layout }))
    let prevIndex: number | null = null

    for (let i = 0; i < layouts.length; i++) {
        const layout = layouts[i]
        if (layout.leftClass == null && layout.rightClass == null) continue

        if (prevIndex == null) {
            // leftmost mbin becomes mord
            cancel_layout_left_bin(layout)
        } else if (layout.leftClass != null) {
            const prev = layouts[prevIndex]

            // mbin before (rel|close|punct|rightmost) becomes mord
            if (prev.rightClass == 'mbin' && BIN_RIGHT_CANCELLER.has(layout.leftClass)) {
                cancel_layout_right_bin(prev)
            }

            // mbin after (leftmost|mbin|open|rel|op|punct) becomes mord
            const prevClass = prev.rightClass
            if (layout.leftClass == 'mbin' && (prevClass == null || BIN_LEFT_CANCELLER.has(prevClass))) {
                cancel_layout_left_bin(layout)
            }
        }

        prevIndex = i
    }

    if (prevIndex != null) {
        // rightmost mbin becomes mord
        cancel_layout_right_bin(layouts[prevIndex])
    }

    return layouts
}

//
// symbols and fonts
//

type FontFamily = 'KaTeX_Math' | 'KaTeX_Main' | 'KaTeX_AMS' | 'KaTeX_Size1'
const FONTS: Record<SymbolMode, FontFamily> = {
    'math': 'KaTeX_Math',
    'text': 'KaTeX_Main',
}
const OP_SYMBOL_FONT: FontFamily = 'KaTeX_Size1'

const FAMILY_CLASS: Record<SymbolFamily, AtomClass | null> = {
    'mathord': 'mord',
    'textord': 'mord',
    'bin': 'mbin',
    'rel': 'mrel',
    'open': 'mopen',
    'close': 'mclose',
    'punct': 'mpunct',
    'inner': 'minner',
    'op-token': 'mop',
    'accent-token': 'mord',
    'spacing': null,
}

function symbol_group_class(entry: SymbolEntry | null): AtomClass {
    if (entry == null) return 'mord'
    return FAMILY_CLASS[entry.family] ?? 'mord'
}

function get_symbol(mode: SymbolMode, text: string): SymbolEntry | null {
    if (text in symbols[mode]) return symbols[mode][text]
    return null
}

function atom_font(entry: SymbolEntry | null): FontFamily {
    if (entry?.font == 'ams') return 'KaTeX_AMS'
    return 'KaTeX_Main'
}

function make_span(text: string, attr: Attrs = {}): Span {
    return new Span({ children: [ text ], ...attr })
}

function make_symbol(mode: SymbolMode, text: string, args: Attrs = {}): MathLayout {
    const { fallback = null, font_family = FONTS[mode], ...attr } = args
    const entry = get_symbol(mode, text)
    const children = entry?.replace ?? fallback ?? text
    const element = make_span(children, { font_family, ...attr })
    const klass = symbol_group_class(entry)
    return layout_with(element, klass)
}

//
// parse katex tree
//

const ROW_PADDING = 0.05
const SCRIPT_SCALE = 1.0
const SCRIPT_SPACE = 0.05
const SCRIPT_SHIFT = 0.05

const FRAC_SCALE = 1.0
const FRAC_PAD = 0.06
const FRAC_RULE_SIZE = 0.015
const FRAC_RULE_GAP = 0.05
const FRAC_NO_RULE_GAP = 0.22
const FRAC_DELIM_GAP = 0.04

const STYLE_SCALE: Record<string, number> = {
    display: 1,
    text: 1,
    script: SCRIPT_SCALE,
    scriptscript: SCRIPT_SCALE * SCRIPT_SCALE,
}

function element_aspect(element: Element | null): number {
    return element?.spec.aspect ?? 1
}

function scale_script(element: Element, scale: number = SCRIPT_SCALE): Element {
    const ypad = (1 - scale) / 2
    const child = element.clone({ rect: [ 0, ypad, 1, 1 - ypad ] })
    return new Group({ children: [ child ], aspect: element_aspect(element) * scale })
}

function make_supsub_side(sup: MathLayout | null, sub: MathLayout | null): Element {
    const supElem = sup ? sup.element : new Spacer()
    const subElem = sub ? sub.element : new Spacer()
    const supBox = new Box({
        children: [ supElem ], padding: [0, (1 - SCRIPT_SCALE) / 2], stack_size: (1 - SCRIPT_SPACE) / 2
    })
    const subBox = new Box({
        children: [ subElem ], padding: [0, (1 - SCRIPT_SCALE) / 2], stack_size: (1 - SCRIPT_SPACE) / 2
    })
    const spacer = new Spacer({ stack_size: SCRIPT_SPACE })
    const stack = new VStack({
        children: [ supBox, spacer, subBox ], justify: 'left', pos: [0.5, 0.5 + SCRIPT_SHIFT]
    })
    return new Box({ children: [ stack ] })
}

function make_delimiter(mode: SymbolMode, delim: string | null | undefined): Element | null {
    if (delim == null || delim == '.') return null
    const entry = get_symbol(mode, delim)
    const font_family = atom_font(entry)
    return make_symbol(mode, delim, { font_family }).element
}

function make_genfrac_core(numer: MathLayout, denom: MathLayout, hasBarLine: boolean): Element {
    const numerElem = scale_script(numer.element, FRAC_SCALE)
    const denomElem = scale_script(denom.element, FRAC_SCALE)
    const coreAspect = Math.max(element_aspect(numerElem), element_aspect(denomElem)) + 2 * FRAC_PAD

    const gapTop = hasBarLine ? FRAC_RULE_GAP : FRAC_NO_RULE_GAP / 2
    const gapBot = hasBarLine ? FRAC_RULE_GAP : FRAC_NO_RULE_GAP / 2
    const lineSize = hasBarLine ? FRAC_RULE_SIZE : 0
    const sideSize = (1 - gapTop - gapBot - lineSize) / 2

    const numerBox = new Box({
        children: [ numerElem ],
        aspect: coreAspect,
        padding: [ FRAC_PAD, 0 ],
        stack_size: sideSize,
    })
    const denomBox = new Box({
        children: [ denomElem ],
        aspect: coreAspect,
        padding: [ FRAC_PAD, 0 ],
        stack_size: sideSize,
    })

    const children: Element[] = [
        numerBox,
        new Spacer({ stack_size: gapTop }),
    ]

    if (hasBarLine) {
        children.push(new Rectangle({ fill: black, stack_size: lineSize }))
    }

    children.push(
        new Spacer({ stack_size: gapBot }),
        denomBox,
    )

    return new VStack({ children, justify: 'center' })
}

function layout_styling(body: TreeNode[], style: string): MathLayout {
    const layout = convert_tree(body)
    const scale = STYLE_SCALE[style] ?? 1
    if (scale == 1) return layout
    const elem = scale_script(layout.element, scale)
    return layout_from(elem, layout.leftClass, layout.rightClass)
}

function layout_row(nodes: (Tree | TreeNode)[]): MathLayout {
    if (nodes.length == 0) return EMPTY_LAYOUT
    const layouts = cancel_binary_atoms(nodes.map(node => convert_tree(node)))
    const children: Element[] = ROW_PADDING > 0 ? [ new Spacer({ aspect: ROW_PADDING }) ] : []
    let leftClass: AtomClass | null = null
    let rightClass: AtomClass | null = null
    let prevClass: AtomClass | null = null

    for (const layout of layouts) {
        if (layout.leftClass && prevClass) {
            const gap = inter_atom_spacing(prevClass, layout.leftClass)
            if (gap > 0) {
                children.push(new Spacer({ aspect: gap }))
            }
        }
        children.push(layout.element)
        if (leftClass == null) leftClass = layout.leftClass
        if (layout.rightClass != null) {
            prevClass = layout.rightClass
            rightClass = layout.rightClass
        }
    }

    if (ROW_PADDING > 0) {
        children.push(new Spacer({ aspect: ROW_PADDING }))
    }

    if (rightClass == null) rightClass = leftClass
    const element = new HStack({ children })
    return layout_from(element, leftClass, rightClass)
}

function convert_tree(tree: Tree | TreeNode | null | undefined): MathLayout {
    if (tree == null) return EMPTY_LAYOUT
    if (is_array(tree)) {
        return layout_row(tree)
    } else if (is_object(tree)) {
        const { type } = tree
        if (type == 'mathord') {
            const { mode, text } = tree
            return make_symbol(mode, text, { font_family: FONTS['math'] })
        } else if (type == 'textord') {
            const { mode, text } = tree
            return make_symbol(mode, text, { font_family: FONTS['text'] })
        } else if (type == 'atom') {
            const { mode, text, family } = tree
            const entry = get_symbol(mode, text)
            const font_family = atom_font(entry)
            const { element, leftClass } = make_symbol(mode, text, { font_family })
            const klass = family != null ? (FAMILY_CLASS[family] ?? 'mord') : leftClass
            return layout_with(element, klass)
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'op') {
            const { mode, name } = tree
            const entry = get_symbol(mode, name)
            if (entry != null) {
                const span = make_span(entry.replace ?? name, { font_family: OP_SYMBOL_FONT })
                return layout_with(span, 'mop')
            } else {
                const name1 = name.slice(1)
                const span = make_span(name1, { font_family: FONTS['text'] })
                return layout_with(span, 'mop')
            }
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'styling') {
            const { body, style } = tree
            return layout_styling(body, style)
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const base = convert_tree(base0)
            const sup = sup0 ? convert_tree(sup0) : null
            const sub = sub0 ? convert_tree(sub0) : null

            const supsub = make_supsub_side(sup, sub)
            const row = new HStack({ children: [ base.element, supsub ] })
            return layout_from(row, base.leftClass, base.rightClass)
        } else if (type == 'genfrac') {
            const {
                mode = 'math',
                numer: numer0,
                denom: denom0,
                hasBarLine = true,
                leftDelim = null,
                rightDelim = null,
            } = tree
            const numer = convert_tree(numer0)
            const denom = convert_tree(denom0)

            const frac = make_genfrac_core(numer, denom, hasBarLine)
            const left = make_delimiter(mode, leftDelim)
            const right = make_delimiter(mode, rightDelim)
            const children: Element[] = []

            if (left != null) {
                children.push(left, new Spacer({ aspect: FRAC_DELIM_GAP }))
            }
            children.push(frac)
            if (right != null) {
                children.push(new Spacer({ aspect: FRAC_DELIM_GAP }), right)
            }

            const element = children.length == 1 ? frac : new HStack({ children })
            return layout_with(element, 'mord')
        }
    }
    return EMPTY_LAYOUT
}

//
// main function
//

function parse_katex(tex: string): Element | null {
    const tree = parse_tex(tex)
    return convert_tree(tree).element
}

export { parse_katex }
