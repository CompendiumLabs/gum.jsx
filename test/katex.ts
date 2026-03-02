import { join, resolve } from 'path'
import { __parse as parse_tex } from 'katex'

import { registerFont, is_array, is_object, Element, Group, Spacer } from '../src/gum'
import symbols from './symbols'
import { EMPTY_MATH, MathSpan, MathText, SupSub, Frac, get_math_classes, set_math_classes } from './math'

import type { SymbolMode, SymbolFamily, SymbolEntry, Tree, TreeNode, Measurement } from 'katex'
import type { Attrs } from '../src/gum'
import type { AtomClass } from './math'

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
    return new MathSpan({ children, font_family, leftClass: klass, rightClass: klass, ...attr })
}

function make_delimiter(mode: SymbolMode, delim: string | null | undefined): Element | null {
    if (delim == null || delim == '.') return null
    const entry = get_symbol(mode, delim)
    const font_family = atom_font(entry)
    return make_symbol(mode, delim, { font_family })
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

function element_aspect(element: Element | null): number {
    return element?.spec.aspect ?? 1
}

const STYLE_SCALE: Record<string, number> = {
    display: 1,
    text: 1,
    script: 1,
    scriptscript: 1,
}

//
// parse katex tree
//

function convert_tree(tree: Tree | TreeNode | null | undefined): Element {
    if (tree == null) return EMPTY_MATH

    if (is_array(tree)) {
        const row = new MathText({ items: tree.map(node => convert_tree(node)) })
        return row.items.length > 0 ? row : EMPTY_MATH
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
                return set_math_classes(element, FAMILY_CLASS[family])
            }
            return element
        } else if (type == 'ordgroup') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'op') {
            const { mode, name } = tree
            const entry = get_symbol(mode, name)
            if (entry != null) {
                return new MathSpan({ children: [ entry.replace ?? name ], leftClass: 'mop', font_family: OP_SYMBOL_FONT })
            } else {
                const name1 = name.slice(1)
                return new MathSpan({ children: [ name1 ], leftClass: 'mop', font_family: FONTS['text'] })
            }
        } else if (type == 'text') {
            const { body } = tree
            return convert_tree(body)
        } else if (type == 'kern') {
            const em = measurement_to_em(tree.dimension)
            return set_math_classes(new Spacer({ aspect: em }), null)
        } else if (type == 'styling') {
            const { body, style } = tree
            const body_element = convert_tree(body)
            const scale = STYLE_SCALE[style] ?? 1
            if (scale == 1) return body_element

            const ypad = (1 - scale) / 2
            const child = body_element.clone({ rect: [ 0, ypad, 1, 1 - ypad ] })
            const scaled = new Group({ children: [ child ], aspect: element_aspect(body_element) * scale })
            const { leftClass, rightClass } = get_math_classes(body_element)
            return set_math_classes(scaled, leftClass, rightClass)
        } else if (type == 'supsub') {
            const { base: base0, sup: sup0, sub: sub0 } = tree
            const base = convert_tree(base0)
            const sup = sup0 ? convert_tree(sup0) : null
            const sub = sub0 ? convert_tree(sub0) : null
            const element = new SupSub({ base, sup, sub })
            const { leftClass, rightClass } = get_math_classes(base)
            return set_math_classes(element, leftClass, rightClass)
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
            return set_math_classes(element, 'mord')
        }
    }

    return EMPTY_MATH
}

//
// main function
//

function parse_katex(tex: string): Element | null {
    const tree = parse_tex(tex)
    return convert_tree(tree)
}

export { parse_katex }
