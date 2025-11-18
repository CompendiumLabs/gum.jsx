import { __parse as parse_tex } from 'katex'
import symbols from './symbols.js'

import { is_array, is_object } from './utils.js'
import { Group, HStack, VStack, Spacer, TextSpan } from './gum.js'

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
        return text
    }
}

function make_symbol(mode, text, attr = {}) {
    const children = get_symbol(mode, text)
    const font_family = FONTS[mode]
    return new TextSpan({ children, font_family, ...attr })
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
            return make_symbol(mode, text)
        } else if (type == 'textord') {
            const { mode, text } = tree
            return make_symbol(mode, text)
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'op') {
            const { mode, name } = tree
            return make_symbol(mode, name)
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const [ base, sup, sub ] = [ base0, sup0, sub0 ].map(x => convert_tree(x))

            // make superscript box
            const sup1 = sup != null ? sup : new Spacer({ aspect: 0.5 })
            const sub1 = sub != null ? sub : new Spacer({ aspect: 0.5 })
            const supsub0 = new VStack({ children: [ sup1, sub1 ], pos: [0.5, 0.55], even: true, justify: 'left' })
            const supsub = new Group({ children: supsub0, aspect: supsub0.spec.aspect })

            // return wrapped base and supsub
            return new HStack({ children: [ base, supsub ] })
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
