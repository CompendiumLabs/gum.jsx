import { __parse as parse_tex } from 'katex'
import type { SymbolMode, Tree, TreeNode } from 'katex'
import symbols from './symbols'
import { is_array, is_object, Element, HStack, VStack, Box, Spacer, Rectangle, Span, type Attrs } from '../src/gum'

type FontFamily = 'KaTeX_Math' | 'KaTeX_Main'

// constants
const FONTS: Record<SymbolMode, FontFamily> = {
    'math': 'KaTeX_Math',
    'text': 'KaTeX_Main',
}

// get symbol from symbols
function get_symbol(mode: SymbolMode, text: string): string | null {
    if (text in symbols[mode]) {
        const { replace } = symbols[mode][text]
        return replace
    } else {
        return null
    }
}

function make_span(text: string | null, attr: Attrs = {}): Span {
    return new Span({ children: [ text ?? '' ], ...attr })
}

function make_symbol(mode: SymbolMode, text: string, args: Attrs = {}): Span {
    const { fallback = null, font_family = FONTS[mode], ...attr } = args
    const children = get_symbol(mode, text) ?? fallback
    return make_span(children, { font_family, ...attr })
}

// parse katex tree
function convert_tree(tree: Tree | TreeNode): Element {
    if (is_array(tree)) {
        const children = tree.map(x => convert_tree(x))
        return new HStack({ children })
    } else if (is_object(tree)) {
        const { type } = tree
        if (type == 'mathord') {
            const { mode, text } = tree
            return make_symbol(mode, text, { font_family: FONTS['math'] })
        } else if (type == 'textord') {
            const { mode, text } = tree
            return make_symbol(mode, text, { font_family: FONTS['text'] })
        } else if (type == 'atom') {
            const { mode, text } = tree
            const sym = make_symbol(mode, text, { font_family: FONTS[mode] })
            const child = sym.clone({ pos: [0.4, 0.57], rad: [0.45, 0.6], expand: true })
            const aspect = child.spec.aspect ?? 1
            return new Box({ children: [ child ], aspect: aspect * 1.2 })
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'op') {
            const { mode, name } = tree
            const sym0 = get_symbol(mode, name)
            const mode1 = sym0 != null ? mode : 'text'
            const name1 = sym0 ?? name.slice(1)
            return make_span(name1, { font_family: FONTS[mode1] })
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const [ base, sup, sub ] = [ base0, sup0, sub0 ].map(x => convert_tree(x))

            // make shifted supsub box
            const children = [ sup ?? new Spacer(), sub ?? new Spacer() ]
            const supsub0 = new VStack({ children, even: true, justify: 'left', pos: [0.5, 0.55] })
            const supsub = new Box({ children: [ supsub0 ] }) // realize shift from above pos^

            // return wrapped base and supsub
            return new HStack({ children: [ base, supsub ] })
        } else if (type == 'genfrac') {
            const { numer: numer0, denom: denom0 } = tree
            const [ numer, denom ] = [ numer0, denom0 ].map(x => convert_tree(x))

            // make frac Vstack
            const line = new Rectangle({ fill: 'black', pos: [0.5, 0.62], rad: [0.5, 0.0075] })
            const denom1 = new Box({ children: [ denom.clone({ pos: [0.5, 0.3] }) ] })
            const stack = new VStack({ children: [ numer, denom1 ], even: true, justify: 'center', spacing: 0.2, pos: [0.5, 0.6], rad: [0.5, 0.6], expand: true })
            const aspect = stack.spec.aspect ?? 1
            return new Box({ children: [ stack, line ], aspect: aspect * 1.3 })
        }
    }
    return new Spacer()
}

// get tex from stdin and parse
function parse_katex(tex: string): Element | null {
    const tree = parse_tex(tex)
    return convert_tree(tree)
}

export { parse_katex }
