import { __parse as parse_tex } from 'katex'
import type { SymbolMode, SymbolEntry, Tree, TreeNode } from 'katex'
import symbols from './symbols'
import { is_array, is_object, Element, HStack, VStack, Box, Spacer, Rectangle, Span, type Attrs } from '../src/gum'
import { registerFont } from '../src/fonts/fonts'
import { join, resolve } from 'path'

//
// register katex fonts
//

const fonts_dir = resolve(__dirname, '../node_modules/katex/dist/fonts')
await registerFont('KaTeX_Math', join(fonts_dir, 'KaTeX_Math-Italic.ttf'))
await registerFont('KaTeX_Main', join(fonts_dir, 'KaTeX_Main-Regular.ttf'))

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

function layout_with(element: Element, klass: AtomClass | null = 'mord'): MathLayout {
    return { element, leftClass: klass, rightClass: klass }
}

function layout_from(element: Element, leftClass: AtomClass | null, rightClass: AtomClass | null = leftClass): MathLayout {
    return { element, leftClass, rightClass }
}

//
// symbols and fonts
//

type FontFamily = 'KaTeX_Math' | 'KaTeX_Main'
const FONTS: Record<SymbolMode, FontFamily> = {
    'math': 'KaTeX_Math',
    'text': 'KaTeX_Main',
}

const GROUP_CLASS: Record<string, AtomClass> = {
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
}

function symbol_group_class(entry: SymbolEntry | null | undefined): AtomClass | null {
    if (entry?.group == null) return 'mord'
    if (entry.group === 'spacing') return null
    return GROUP_CLASS[entry.group] ?? 'mord'
}

function get_symbol(mode: SymbolMode, text: string): SymbolEntry | null {
    if (text in symbols[mode]) {
        return symbols[mode][text]
    }
    return null
}

function make_span(text: string | null, attr: Attrs = {}): Span {
    return new Span({ children: [ text ?? '' ], ...attr })
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

function layout_row(nodes: (Tree | TreeNode)[]): MathLayout {
    if (nodes.length == 0) return EMPTY_LAYOUT
    const children: Element[] = ROW_PADDING > 0 ? [ new Spacer({ aspect: ROW_PADDING }) ] : []
    let leftClass: AtomClass | null = null
    let rightClass: AtomClass | null = null
    let prevClass: AtomClass | null = null

    for (const node of nodes) {
        const layout = convert_tree(node)
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
    return layout_from(new HStack({ children }), leftClass, rightClass)
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
            const { mode, text, family } = tree as { mode: SymbolMode, text: string, family?: string }
            const sym = make_symbol(mode, text, { font_family: FONTS[mode] })
            const child = sym.element.clone({ pos: [0.4, 0.57], rad: [0.45, 0.6], expand: true })
            const aspect = child.spec.aspect ?? 1
            const box = new Box({ children: [ child ], aspect: aspect * 1.2 })
            const klass = family != null ? (GROUP_CLASS[family] ?? 'mord') : sym.leftClass
            return layout_with(box, klass ?? 'mord')
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'op') {
            const { mode, name } = tree
            const entry = get_symbol(mode, name)
            if (entry != null) {
                const span = make_span(entry.replace ?? name, { font_family: FONTS[mode] })
                return layout_with(span, 'mop')
            } else {
                const name1 = name.slice(1)
                const span = make_span(name1, { font_family: FONTS['text'] })
                return layout_with(span, 'mop')
            }
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const base = convert_tree(base0)
            const sup = sup0 ? convert_tree(sup0) : null
            const sub = sub0 ? convert_tree(sub0) : null

            const children = [ sup?.element ?? new Spacer(), sub?.element ?? new Spacer() ]
            const supsub0 = new VStack({ children, even: true, justify: 'left', pos: [0.5, 0.55] })
            const supsub = new Box({ children: [ supsub0 ] })
            const row = new HStack({ children: [ base.element, supsub ] })
            return layout_from(row, base.leftClass, base.rightClass)
        } else if (type == 'genfrac') {
            const { numer: numer0, denom: denom0 } = tree
            const numer = convert_tree(numer0)
            const denom = convert_tree(denom0)

            const line = new Rectangle({ fill: 'black', pos: [0.5, 0.62], rad: [0.5, 0.0075] })
            const denom1 = new Box({ children: [ denom.element.clone({ pos: [0.5, 0.3] }) ] })
            const stack = new VStack({ children: [ numer.element, denom1 ], even: true, justify: 'center', spacing: 0.2, pos: [0.5, 0.6], rad: [0.5, 0.6], expand: true })
            const aspect = stack.spec.aspect ?? 1
            const frac = new Box({ children: [ stack, line ], aspect: aspect * 1.3 })
            return layout_with(frac, 'mord')
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
