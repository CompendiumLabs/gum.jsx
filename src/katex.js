import { __parse as parse_tex } from 'katex'
import symbols from './symbols.js'

import { is_array, is_object } from './utils.js'
import { Group, HStack, VStack, Box, Spacer, TextSpan, Rect, HLine } from './gum.js'

// constants
const FONTS = {
    'math': 'Katex_Math-Italic',
    'text': 'Katex_Main-Regular',
}

// get symbol from symbols
function get_symbol(mode, text) {
    if (text in symbols[mode]) {
        const { replace } = symbols[mode][text]
        return replace
    } else {
        return null
    }
}

function make_span(children, attr = {}) {
    return new TextSpan({ children, ...attr })
}

function make_symbol(mode, text, args = {}) {
    const { fallback = null, font_family = FONTS[mode], ...attr } = args
    const children = get_symbol(mode, text, fallback)
    return make_span(children, { font_family, ...attr })
}

// parse katex tree
function convert_tree(tree) {
    if (tree == null) return null
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
            return new Box({ children: child, aspect: child.spec.aspect + 0.1 })
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
            const supsub = new Box({ children: supsub0 }) // realize shift from above pos^

            // return wrapped base and supsub
            return new HStack({ children: [ base, supsub ] })
        } else if (type == 'genfrac') {
            const { numer: numer0, denom: denom0 } = tree
            const [ numer, denom ] = [ numer0, denom0 ].map(x => convert_tree(x))

            // make frac Vstack
            const line = new Rect({ fill: 'black', pos: [0.5, 0.62], rad: [0.5, 0.0075] })
            const denom1 = new Box({ children: denom.clone({ pos: [0.5, 0.3] }) })
            const stack = new VStack({ children: [ numer, denom1 ], even: true, justify: 'center', spacing: 0.2, pos: [0.5, 0.6], rad: [0.5, 0.6], expand: true })
            return new Box({ children: [ stack, line ], aspect: stack.spec.aspect * 1.3 })
        } else {
            console.log(`Unsupported katex type: ${type}`)
        }
    } else {
        console.log(`Unsupported katex node: ${tree}`)
    }
}

// get tex from stdin and parse
function parse_katex(tex) {
    const tree = parse_tex(tex)
    const parsed = convert_tree(tree)
    return parsed
}

export { parse_katex }
