// text elements

import type { Attrs, AlignValue, Rect, Limit } from '../lib/types'
import { THEME } from '../lib/theme'
import { none, bold, vtext, maxis } from '../lib/const'
import { check_string, is_scalar, is_string, is_boolean, compress_whitespace, rect_box, check_singleton, prefix_split, prefix_join, sum } from '../lib/utils'
import { textMetrics, splitWords } from '../lib/text'
import { fontFace } from '../fonts/fonts'
import type { TextMetrics } from '../lib/text'
import { wrapWidths } from '../lib/wrap'

import { Context, Element, Group, Spacer, spec_split, ensure_children, escape_text, is_element } from './core'
import type { ElementArgs, GroupArgs } from './core'
import { Box, HStack, VStack } from './layout'
import type { BoxArgs, StackArgs } from './layout'

//
// span class
//

interface SpanArgs extends ElementArgs {
    children?: string[]
    color?: string
    stroke?: string
    vshift?: number
    font_family?: string
    font_weight?: number
    font_style?: string
}

// no wrapping at all, clobber newlines, mainly internal use
// the output attributes for a font: the bold and italic KaTeX faces are
// addressed by base family plus weight and style (see fontFace)
function font_css({ font_family, font_weight, font_style }: { font_family?: string, font_weight?: number, font_style?: string }): Attrs {
    if (font_family == null) return {}
    const face = fontFace(font_family)
    if (face.family == font_family) return {}
    return { font_family: face.family, font_weight: face.weight ?? font_weight, font_style: face.style ?? font_style }
}

class Span extends Element {
    text: string
    metrics: TextMetrics
    vshift: number

    constructor(args: SpanArgs = {}) {
        const { children: children0, color, vshift = vtext, stroke = none, ...attr0 } = THEME(args, 'Span')
        const text0 = check_string(children0)
        const [ font_attr0, attr ] = prefix_split([ 'font' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // compress whitespace, since that's what SVG does
        const text = compress_whitespace(text0)
        const { advance, vrange, raw_vrange = vrange, italic = 0 } = textMetrics(text, font_attr)

        // adjust metrics for vertical shift
        const [ ymin, ymax ] = vrange
        const [ raw_ymin, raw_ymax ] = raw_vrange
        const vrange_shift: Limit = [ ymin + vshift, ymax + vshift ]
        const raw_vrange_shift: Limit = [ raw_ymin + vshift, raw_ymax + vshift ]
        const metrics = { advance, vrange: vrange_shift, raw_vrange: raw_vrange_shift, italic }

        // pass to element; the font is measured by its registry name but named
        // in the output by its css face (family plus weight and style)
        super({ tag: 'text', unary: false, aspect: advance, fill: color, stroke, ...font_attr, ...font_css(font_attr), ...attr })
        this.args = args

        // additional props
        this.text = text
        this.metrics = metrics
        this.vshift = vshift
    }

    // because text will always be displayed upright,
    // we need to find the ordered bounds of the text
    // and then offset it by the given offset
    props(ctx: Context): Attrs {
        const attr = super.props(ctx)

        // compute glyph rect without vshift (apply vshift in pixel space)
        const { vrange: [ ymin, ymax ] } = this.metrics
        const vshift = this.vshift
        const glyph_rect: Rect = [ 0, ymin - vshift, 1, ymax - vshift ]
        const rect = ctx.mapRect(glyph_rect)

        // get position and size
        const [ x, y0, _w, h ] = rect_box(rect, true)
        const y = y0 + (1 + vshift) * h

        // get adjusted size
        return { x, y, font_size: `${h}px`, ...attr }
    }

    inner(_ctx: Context): string {
        return escape_text(this.text)
    }
}

interface ElemSpanArgs extends GroupArgs {
    spacing?: boolean | number
}

// math elements carry inline metrics (advance, ink extents around the math
// axis) in em units; the line box is 1em tall with the text baseline at
// 1 + vtext, so the math axis sits maxis above that
const INLINE_MATH_AXIS = 1 + vtext - maxis

// the subset of math metrics needed for inline placement (see MathSpec)
interface InlineMath {
    advance: number
    vrange: Limit
    vanchor: number
    hrange?: Limit
}

// place a math element in a 1em line box by its inline metrics: 1em of math
// is 1 line height, the axis is pinned to the text axis, and tall formulas
// overflow the line rather than shrinking to fit it (as in TeX). returns the
// ink width in em along with the positioned child
function place_inline_math(child: Element, spacing: number): [ Element, number ] {
    const { advance, vrange: [ ylo, yhi ], vanchor, hrange } = (child as Element & { math: InlineMath }).math
    const [ xlo, xhi ] = hrange ?? [ 0, advance ]
    const width = xhi - xlo
    const aspect = width + spacing
    const xfrac = aspect > 0 ? width / aspect : 1
    const y0 = INLINE_MATH_AXIS + (ylo - vanchor)
    const y1 = INLINE_MATH_AXIS + (yhi - vanchor)
    const rect: Rect = [ 0, y0, xfrac, y1 ]
    return [ child.clone({ rect, align: 'left' }), aspect ]
}

class ElemSpan extends Group {
    constructor(args: ElemSpanArgs = {}) {
        const { children: children0, spacing: spacing0 = true, ...attr } = args
        const child0 = check_singleton(children0)
        const spacing = is_boolean(spacing0) ? (spacing0 ? 0.25 : 0) : spacing0

        // HStack centers arbitrary embedded elements in the line box, while
        // math is aligned to the surrounding text by its metrics
        const [ child, aspect ] = 'math' in child0 ?
            place_inline_math(child0, spacing) :
            [ child0.clone({ align: 'left' }), (child0.spec.aspect ?? 1) + spacing ]

        super({ children: [ child ], aspect, ...attr })
        this.args = args
    }
}

//
// text class
//

function ensure_tail(text: string): string {
    return `${text.trimEnd()} `
}

function split_span(child: Span, text: string, font_args: Attrs = {}): Element[] {
    return splitWords(text).map((w: string) =>
        child.clone({ children: [ w ], ...font_args })
    )
}

function compress_spans(children: any[], font_args: Attrs = {}): Element[] {
    return children.flatMap((child: any, i: number) => {
        const last_child = i == children.length - 1

        // convert scalars to strings
        if (is_scalar(child)) child = child.toString()

        // process strings into Span's
        // process Text into Span's
        // process Spans into Span's (with args)
        // process Elements into ElemSpan's
        // every child but the last ends in a space, so a child never needs
        // to start with one (a leading space would double up)
        if (is_string(child)) {
            let text = compress_whitespace(child).trimStart()
            if (!last_child) text = ensure_tail(text)
            if (last_child) text = text.trimEnd()
            return splitWords(text).map((w: string) =>
                new Span({ children: [ w ], ...font_args })
            )
        } else if (child instanceof Text) {
            const spans = child.spans.flatMap((s: Element, i: number) => {
                if (!(s instanceof Span)) return [ s ]
                let { text } = s
                if (i == 0) text = text.trimStart()
                if (i == child.spans.length - 1) text = text.trimEnd()
                return split_span(s, text, font_args)
            })
            return last_child ? spans : [ ...spans, new Span({ children: [ ' ' ], ...font_args }) ]
        } else if (child instanceof Span) {
            const spans = split_span(child, child.text.trim(), font_args)
            return last_child ? spans : [ ...spans, new Span({ children: [ ' ' ], ...font_args }) ]
        } else if (child instanceof ElemSpan) {
            return child.clone({ spacing: !last_child })
        } else {
            return [ new ElemSpan({ children: [ child ], spacing: !last_child }) ]
        }
    })
}

function trim_line_end(child: Element): Element | null {
    if (child instanceof Span) {
        const text = child.text.trimEnd()
        return text.length > 0 ? child.clone({ children: [ text ] }) : null
    }
    if (child instanceof ElemSpan) {
        return child.clone({ spacing: false })
    }
    return child
}

function normalize_line(children: Element[]): Element[] {
    for (let i = children.length - 1; i >= 0; i--) {
        const child = trim_line_end(children[i])
        if (child == null) continue
        return [ ...children.slice(0, i), child ]
    }
    return []
}

interface TextLineArgs extends GroupArgs {
    padding?: number
    justify?: AlignValue
    wrap?: number
}

class TextLine extends Group {
    constructor(args: TextLineArgs = {}) {
        const { children: children0, padding, justify = 'left', wrap, debug, ...attr } = THEME(args, 'TextLine')
        const children = ensure_children(children0)
        const line = new HStack({ children, spacing: padding, align: justify, debug })
        super({ children: [ line ], aspect: wrap ?? line.spec.aspect, ...attr })
        this.args = args
    }
}

interface TextArgs extends StackArgs {
    font_family?: string
    font_weight?: number
    font_style?: string
}

// wrap text or elements to multiple lines with fixed line height
class Text extends VStack {
    spans: Element[]

    constructor(args: TextArgs = {}) {
        const { children: children0, wrap, spacing, padding, justify, debug, ...attr0 } = THEME(args, 'Text')
        const children = ensure_children(children0)
    	const [ spec, attr ] = spec_split(attr0)

        // split into words and elements
        const spans = compress_spans(children, attr)

        // wrap text to line widths
        const measure = (span: Element) => span.spec.aspect ?? 1
        const { rows } = wrapWidths(spans, measure, wrap)

        // construct text lines
        const lines = rows.map(row =>
            new TextLine({ children: normalize_line(row), padding, justify, wrap, debug })
        )

        // pass to VStack
        super({ children: lines, spacing, even: true, ...spec })
        this.args = args

        // additional props
        this.spans = spans
    }
}

//
// text container classes
//

interface TextStackArgs extends StackArgs {
    wrap?: number
}

class TextStack extends VStack {
    constructor(args: TextStackArgs = {}) {
        const { children: children0, wrap = null, justify = 'left', ...attr0 } = THEME(args, 'TextStack')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children = ensure_children(children0)

        // apply wrap and justify to children, unless they set their own (a
        // narrower wrap makes larger text, which is how headings are made)
        const elems = children.map((c: Element) => {
            const { wrap: wrap0, justify: justify0 } = c.args ?? {}
            return c.clone({ ...font_attr, ...text_attr, wrap: wrap0 ?? wrap, justify: justify0 ?? justify })
        })

        // pass to VStack
        super({ children: elems, ...attr })
        this.args = args
    }
}

interface TextBoxArgs extends BoxArgs {
    justify?: AlignValue
    wrap?: number
}

class TextBox extends Box {
    constructor(args: TextBoxArgs = {}) {
        const { children, padding = 0.1, justify, wrap, ...attr0 } = THEME(args, 'TextBox')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const text = new Text({ children, justify, wrap, ...text_attr, ...font_attr })
        super({ children: [ text ], padding, ...attr })
        this.args = args
    }
}

interface TextFrameArgs extends TextBoxArgs {
    border?: number
    rounded?: number
}

class TextFrame extends TextBox {
    constructor(args: TextFrameArgs = {}) {
        const { border = 1, ...attr } = THEME(args, 'TextFrame')
        super({ border, ...attr })
    }
}

//
// bullet list
//

interface BulletsArgs extends StackArgs {
    wrap?: number
    marker?: string | Element
    indent?: number
    gap?: number
    font_family?: string
    font_weight?: number
    font_style?: string
}

// a bulleted list: each item is a Text wrapped to the body width with a marker
// in the indent, level with its first line. nested Bullets are indented without
// a marker. widths are in em so the text size matches surrounding text with the
// same wrap; the gap between items is also in em
class Bullets extends VStack {
    constructor(args: BulletsArgs = {}) {
        const { children: children0, wrap = 25, marker: marker0 = '•', indent = 0.75, gap = 0.5, spacing: spacing0, justify = 'left', ...attr0 } = THEME(args, 'Bullets')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children: any[] = ensure_children(children0)

        // the body is narrower than the list by the indent
        const wrap_body = wrap - indent
        if (wrap_body <= 0) throw new Error(`Bullets indent (${indent}) must be less than wrap (${wrap})`)

        // the indent is a fixed fraction of each row, so it never sets the row
        // height. the marker sits in a one-line box (indent em by one em) at
        // the top of the indent: level with the first line of the body, or
        // shrunk to the row when the body is shorter than a line
        const cell = { stack_size: indent / wrap }
        const marker: Element = is_element(marker0) ? marker0 : new Text({ children: [ marker0 ] as any, align: ['left', 'center'], ...font_attr })
        const mark = new Group({ children: [ marker ], aspect: indent, align: [ 'center', 'top' ], ...cell })

        // build item rows
        const rows = children.map((child: any) => {
            // sublists are indented but get no marker
            if (child instanceof Bullets) {
                const sub = child.clone({ wrap: wrap_body, justify, ...font_attr, ...text_attr })
                return new HStack({ children: [ new Spacer(cell), sub ] })
            }

            // wrap text items to the body width, take other elements as they are
            const body: Element = child instanceof Text ? child.clone({ wrap: wrap_body, justify, ...font_attr, ...text_attr }) : child
            return new HStack({ children: [ mark, body ] })
        })

        // convert the gap in em into a stack spacing fraction
        const heights = rows.map(r => r.spec.aspect != null ? wrap / r.spec.aspect : 0)
        const content = sum(heights)
        const gaps = gap * Math.max(rows.length - 1, 0)
        const spacing = spacing0 ?? (content + gaps > 0 ? gaps / (content + gaps) : 0)

        // pass to VStack
        super({ children: rows, spacing, justify, ...attr })
        this.args = args
    }
}

//
// text styles
//

class Bold extends Text {
    constructor(args: TextArgs = {}) {
        const attr = THEME(args, 'Bold')
        super({ font_weight: bold, ...attr })
    }
}

class Italic extends Text {
    constructor(args: TextArgs = {}) {
        const attr = THEME(args, 'Italic')
        super({ font_style: 'italic', ...attr })
    }
}

//
// exports
//

export { Span, ElemSpan, TextLine, Text, TextStack, TextBox, TextFrame, Bullets, Bold, Italic }
export type { SpanArgs, ElemSpanArgs, TextLineArgs, TextArgs, TextStackArgs, TextBoxArgs, TextFrameArgs, BulletsArgs }
