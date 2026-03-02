import { join, resolve } from 'path'
import { __parse as parse_tex } from 'katex'

import { registerFont, is_array, is_object, Element, Spacer } from '../src/gum'
import symbols from './symbols'
import { EMPTY_LAYOUT, MathSpan, layout_frac, layout_from, layout_row, layout_style, layout_supsub, layout_with } from './math'

import type { SymbolMode, SymbolFamily, SymbolEntry, Tree, TreeNode, Measurement } from 'katex'
import type { Attrs } from '../src/gum'
import type { AtomClass, MathLayout } from './math'

//
// register katex fonts
//

const fonts_dir = resolve(__dirname, '../node_modules/katex/dist/fonts')
await registerFont('KaTeX_Math', join(fonts_dir, 'KaTeX_Math-Italic.ttf'))
await registerFont('KaTeX_Main', join(fonts_dir, 'KaTeX_Main-Regular.ttf'))
await registerFont('KaTeX_AMS', join(fonts_dir, 'KaTeX_AMS-Regular.ttf'))
await registerFont('KaTeX_Size1', join(fonts_dir, 'KaTeX_Size1-Regular.ttf'))

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

function make_symbol(mode: SymbolMode, text: string, args: Attrs = {}): MathLayout {
    const { fallback = null, font_family = FONTS[mode], ...attr } = args
    const entry = get_symbol(mode, text)
    const children = entry?.replace ?? fallback ?? text
    const klass = symbol_group_class(entry)
    const span = new MathSpan({ children, font_family, leftClass: klass, rightClass: klass, ...attr })
    return layout_from(span, span.leftClass, span.rightClass)
}

function make_delimiter(mode: SymbolMode, delim: string | null | undefined): Element | null {
    if (delim == null || delim == '.') return null
    const entry = get_symbol(mode, delim)
    const font_family = atom_font(entry)
    return make_symbol(mode, delim, { font_family }).element
}

function measurement_to_em(d: Measurement): number {
    const scale: Record<string, number> = {
        mu: 1 / 18,
        em: 1,
        pt: 1 / 10,
        ex: 0.431,
    }
    return d.number * (scale[d.unit] ?? 0)
}

//
// parse katex tree
//

function convert_tree(tree: Tree | TreeNode | null | undefined): MathLayout {
    if (tree == null) return EMPTY_LAYOUT
    if (is_array(tree)) {
        return layout_row(tree.map(node => convert_tree(node)))
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
                const op = new MathSpan({ children: [ entry.replace ?? name ], leftClass: 'mop', font_family: OP_SYMBOL_FONT })
                return layout_from(op, op.leftClass, op.rightClass)
            } else {
                const name1 = name.slice(1)
                const op = new MathSpan({ children: [ name1 ], leftClass: 'mop', font_family: FONTS['text'] })
                return layout_from(op, op.leftClass, op.rightClass)
            }
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'kern') {
            const em = measurement_to_em(tree.dimension)
            return layout_with(new Spacer({ aspect: em }), null)
        } else if (type == 'styling') {
            const { body, style } = tree
            const body_layout = convert_tree(body)
            return layout_style(body_layout, style)
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const base = convert_tree(base0)
            const sup = sup0 ? convert_tree(sup0) : null
            const sub = sub0 ? convert_tree(sub0) : null
            return layout_supsub(base, sup, sub)
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
            return layout_frac(numer, denom, {
                has_bar: hasBarLine,
                left,
                right,
            })
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
