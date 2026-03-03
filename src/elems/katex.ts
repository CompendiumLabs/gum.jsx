import { __parse as parse_tex } from 'katex'

import symbols from '../lib/symbols'
import { THEME } from '../lib/theme'
import { is_array, is_object, check_string, maximum } from '../lib/utils'
import { Element, Spacer } from '../elems/core'
import { Box } from '../elems/layout'
import { OP_SYMBOL_FONT, EMPTY_MATH, measurement_to_em, MathSpan, MathText, SupSub, Frac, Sqrt, Bracket, get_math, set_math } from './math'

import type { SymbolMode, SymbolFamily, SymbolEntry, Tree, TreeNode } from 'katex'
import type { AtomClass, FontFamily } from './math'
import type { Attrs } from '../lib/types'
import type { ElementArgs } from './core'

//
// symbols and fonts
//

const FONTS: Record<SymbolMode, FontFamily> = {
    'math': 'KaTeX_Math',
    'text': 'KaTeX_Main',
}

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

interface SymbolArgs extends Attrs {
    fallback?: string | null
    font_family?: FontFamily
    klass?: AtomClass | null
}

function make_symbol(mode: SymbolMode, text: string, args: SymbolArgs = {}): Element {
    const { fallback = null, font_family = FONTS[mode], klass: klass0 = null, ...attr } = args
    const entry = get_symbol(mode, text)
    const children = entry?.replace ?? fallback ?? text
    const klass = klass0 ?? symbol_group_class(entry)
    return new MathSpan({ children, font_family, left: klass, right: klass, ...attr })
}

function make_delimiter(mode: SymbolMode, delim: string | null | undefined): Element | null {
    if (delim == null || delim == '.') return null
    const entry = get_symbol(mode, delim)
    const font_family = atom_font(entry)
    return make_symbol(mode, delim, { font_family })
}

// quick delimiter-sizing heuristic based on parse subtree shape
function delimiter_size(tree: Tree | TreeNode | null | undefined): number {
    if (tree == null) return 1

    if (is_array(tree)) {
        const size = tree.reduce((acc, node) => Math.max(acc, delimiter_size(node)), 1)
        return Math.max(1, Math.min(4, size))
    }

    if (is_object(tree)) {
        const { type } = tree
        if (type == 'genfrac') {
            return 3
        } else if (type == 'supsub') {
            const { base, sup, sub } = tree
            return Math.max(2, maximum(delimiter_size(base), delimiter_size(sup), delimiter_size(sub)) ?? 1)
        } else if (type == 'sqrt') {
            const { body, index } = tree
            return Math.max(2, maximum(delimiter_size(body), delimiter_size(index)) ?? 1)
        } else if (type == 'leftright') {
            const { body } = tree
            return delimiter_size(body)
        } else if (type == 'styling') {
            const { body, style } = tree
            const size = delimiter_size(body)
            return (style == 'display') ? Math.min(4, size + 1) : size
        } else if (type == 'ordgroup' || type == 'text') {
            const { body } = tree
            return delimiter_size(body)
        }
    }

    return 1
}

function delimiter_font(size: number): FontFamily {
    if (size >= 5) return 'KaTeX_Size4'
    if (size == 4) return 'KaTeX_Size3'
    if (size == 3) return 'KaTeX_Size2'
    if (size == 2) return 'KaTeX_Size1'
    return 'KaTeX_Main'
}

function make_auto_delimiter(mode: SymbolMode, delim: string | null | undefined, side: 'left' | 'right', size: number): Element | null {
    if (delim == null || delim == '.') return null
    const klass: AtomClass = side == 'left' ? 'mopen' : 'mclose'
    const font_family = delimiter_font(size)
    return make_symbol(mode, delim, { font_family, klass })
}

//
// parse katex tree
//

function convert_tree(tree: Tree | TreeNode | null | undefined): Element {
    if (tree == null) return EMPTY_MATH

    if (is_array(tree)) {
        const row = new MathText({ children: tree.map(node => convert_tree(node)) })
        return row.children.length > 0 ? row : EMPTY_MATH
    }

    if (is_object(tree)) {
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
            const element = make_symbol(mode, text, { font_family })
            if (family != null) {
                return set_math(element, { left: FAMILY_CLASS[family], right: FAMILY_CLASS[family] })
            }
            return element
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'op') {
            const { mode, name } = tree
            const entry = get_symbol(mode, name)
            if (entry != null) {
                return new MathSpan({ children: [ entry.replace ?? name ], left: 'mop', right: 'mop', font_family: OP_SYMBOL_FONT })
            } else {
                const name1 = name.slice(1)
                return new MathSpan({ children: [ name1 ], left: 'mop', right: 'mop', font_family: FONTS['text'] })
            }
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'kern') {
            const { dimension } = tree
            const em = measurement_to_em(dimension)
            return new Spacer({ aspect: em })
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const base = convert_tree(base0)
            const sup = sup0 ? convert_tree(sup0) : null
            const sub = sub0 ? convert_tree(sub0) : null
            const element = new SupSub({ base, sup, sub })
            const { left, right } = get_math(base)
            return set_math(element, { left, right })
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
            const left = make_delimiter(mode, leftDelim)
            const right = make_delimiter(mode, rightDelim)
            const element = new Frac({
                numer,
                denom,
                has_bar: hasBarLine,
                left,
                right,
            })
            return set_math(element, { left: 'mord', right: 'mord' })
        } else if (type == 'sqrt') {
            const { body: body0, index: index0 } = tree
            const body = convert_tree(body0)
            const index = index0 ? convert_tree(index0) : null
            return new Sqrt({
                body,
                index,
                radical_font: OP_SYMBOL_FONT,
            })
        } else if (type == 'leftright') {
            const { mode = 'math', body: body0, left: left0, right: right0 } = tree
            const body = convert_tree(body0)
            const size = delimiter_size(body0)
            const left = make_auto_delimiter(mode, left0, 'left', size)
            const right = make_auto_delimiter(mode, right0, 'right', size)
            return new Bracket({ body, left, right })
        }
    }

    return EMPTY_MATH
}

//
// katex parser and component
//

function parse_katex(tex: string): Element | null {
    const tree = parse_tex(tex)
    return convert_tree(tree)
}

class Latex extends Box {
    constructor(args: ElementArgs = {}) {
        const { children, ...attr } = THEME(args, 'Katex')
        const tex = check_string(children)
        const elem = parse_katex(tex)
        super({ children: [ elem ], ...attr })
        this.args = args
    }
}

export { parse_katex, Latex }
