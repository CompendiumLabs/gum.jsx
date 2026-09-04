// text elements

import type { Attrs, AlignValue, Rect, Limit, Padding } from '../lib/types'
import { resolveEnv } from '../lib/default'
import type { Env } from '../env'
import { THEME } from '../lib/theme'
import { none, bold, vtext, maxis } from '../lib/const'
import { check_string, is_scalar, is_string, is_boolean, compress_whitespace, rect_box, check_singleton, prefix_split, prefix_join, sum, max } from '../lib/utils'
import { textMetrics, splitWords } from '../lib/text'
import type { TextMetrics } from '../lib/text'
import { wrapWidths } from '../lib/wrap'
import { make_em, em_bounds, em_hink, em_rect, scale_em_spec } from '../lib/em'
import type { EmSpec, EmMetrics } from '../lib/em'

import { Context, Element, Group, Spacer, spec_split, ensure_children, escape_text, is_element, align_frac } from './core'
import { ensure_em_spec, with_em } from './em'
import type { WithEm } from './em'
import type { ElementArgs, GroupArgs } from './core'
import { Box, HStack, VStack, computeBoxLayout } from './layout'
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
function font_css({ font_family, font_weight, font_style }: { font_family?: string, font_weight?: number, font_style?: string }, env?: Env): Attrs {
    if (font_family == null) return {}
    const face = resolveEnv(env).fonts.face(font_family)
    if (face.family == font_family) return {}
    return { font_family: face.family, font_weight: face.weight ?? font_weight, font_style: face.style ?? font_style }
}

class Span extends Element {
    text: string
    metrics: TextMetrics
    vshift: number

    constructor(args: SpanArgs = {}) {
        const { children: children0, color, vshift = vtext, stroke = none, env, ...attr0 } = THEME(args, 'Span')
        const text0 = check_string(children0)
        const [ font_attr0, attr ] = prefix_split([ 'font' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // compress whitespace, since that's what SVG does
        const text = compress_whitespace(text0)
        const { advance, vrange, raw_vrange = vrange, italic = 0 } = textMetrics(text, { ...font_attr, env })

        // adjust metrics for vertical shift
        const [ ymin, ymax ] = vrange
        const [ raw_ymin, raw_ymax ] = raw_vrange
        const vrange_shift: Limit = [ ymin + vshift, ymax + vshift ]
        const raw_vrange_shift: Limit = [ raw_ymin + vshift, raw_ymax + vshift ]
        const metrics = { advance, vrange: vrange_shift, raw_vrange: raw_vrange_shift, italic }

        // pass to element; the font is measured by its registry name but named
        // in the output by its css face (family plus weight and style)
        super({ tag: 'text', unary: false, aspect: advance, fill: color, stroke, ...font_attr, ...font_css(font_attr, env), ...attr })
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

// elements with em metrics (math, see lib/em.ts) are placed in the line by
// them; the line box is 1em tall with the text baseline at 1 + vtext, so the
// math axis sits maxis above that
const INLINE_MATH_AXIS = 1 + vtext - maxis

// place an element with em metrics in a 1em line box: 1em of its content is 1
// line height, its anchor is pinned to the line's axis, and a tall formula
// overflows the line rather than shrinking to fit it (as in TeX). returns the
// ink width in em along with the positioned child
function place_inline_em(child: WithEm, spacing: number): [ Element, number ] {
    const [ xlo, xhi ] = em_hink(child.em)
    const [ ylo, yhi ] = em_bounds(child.em)
    const width = xhi - xlo
    const aspect = width + spacing
    const xfrac = aspect > 0 ? width / aspect : 1
    const y0 = INLINE_MATH_AXIS + ylo
    const y1 = INLINE_MATH_AXIS + yhi
    const rect: Rect = [ 0, y0, xfrac, y1 ]
    return [ child.clone({ rect, align: 'left' }), aspect ]
}

class ElemSpan extends Group {
    constructor(args: ElemSpanArgs = {}) {
        const { children: children0, spacing: spacing0 = true, ...attr } = args
        const child0 = check_singleton(children0)
        const spacing = is_boolean(spacing0) ? (spacing0 ? 0.25 : 0) : spacing0

        // HStack centers arbitrary embedded elements in the line box, while
        // an element with em metrics is aligned to the surrounding text by them
        const [ child, aspect ] = 'em' in child0 ?
            place_inline_em(child0 as WithEm, spacing) :
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
            return [ new ElemSpan({ children: [ child ], spacing: !last_child, env: font_args.env }) ]
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

//
// em metrics of text
//

// a text block's anchor is the math axis of its first line: the line box is
// 1em tall with the baseline at 1 + vtext, and the axis maxis above that
const TEXT_ANCHOR = INLINE_MATH_AXIS

// the two sizes of a text element: `width` is its width in its own em (where
// its lines break) and `scale` its own em over the parent's, so its box is
// reported `width * scale` wide. a container that stretches a child to a slot
// supplies the `scale` that fills it (or the `width` that a given scale needs)

// the box of a block of lines: `width` in its own em (its given width, or a
// single line's advance), the height from the block's aspect, anchored on the
// first line's axis, stated in the parent's em through `scale`
function block_em(width: number, aspect: number | undefined, scale: number, anchor: number = TEXT_ANCHOR): EmSpec {
    const height = (aspect != null && aspect > 0) ? width / aspect : 1
    return make_em(scale_em_spec({ width, height, anchor, scale: 1 }, scale))
}

// an element's own box: its metrics, or a one em box as wide as its aspect
function child_em(elem: Element): EmMetrics {
    return (elem as WithEm).em ?? ensure_em_spec(elem)
}

// the anchor of a child stretched to a slot `width` wide (its box scaled to
// fit), for a container that puts the child at its top
function slot_anchor(child: Element, width: number): number {
    const { width: w, anchor } = child_em(child)
    return w > 0 ? anchor * (width / w) : 0
}

// the elements that take a text `width` (in their own em) and a `scale`
function is_text_sized(elem: Element): boolean {
    return elem instanceof Text || elem instanceof TextStack || elem instanceof TextBox || elem instanceof Bullets
}

// an element with metrics that is not text itself (a formula) is placed in a
// slot at the text's em rather than stretched to fill it: its box sits at the
// top of the slot, justified within the width, and the slot is as tall as the
// box. one wider than the slot is left to fill it as any element would
function place_em_child(elem: Element, width: number, justify: AlignValue): Element {
    const em = (elem as WithEm).em
    if (em == null || is_text_sized(elem) || em.width <= 0 || em.height <= 0 || em.width > width) return elem
    const x0 = align_frac(justify) * (width - em.width)
    const [ xlo, ylo, xhi, yhi ] = em_rect(em, x0, em.anchor)
    const group = new Group({ children: [ elem.clone({ rect: [ xlo, ylo, xhi, yhi ] }) ], coord: [ 0, 0, width, em.height ], aspect: width / em.height, env: elem.env })
    return with_em(group, { width, height: em.height, anchor: em.anchor, scale: 1 })
}

// the box of a Box around a text element: the inner box expanded by the
// padding and margin the Box laid out (fractions of the outer box)
function box_em(inner: EmSpec, children: Element[], { padding: padding0, margin: margin0, aspect, adjust, env }: { padding?: Padding | boolean, margin?: Padding | boolean, aspect?: number, adjust?: boolean, env?: Env }): EmSpec {
    // a boolean padding or margin means the Box default
    const { padding, margin } = THEME({ padding: padding0, margin: margin0, env }, 'Box') as { padding?: Padding, margin?: Padding }
    const { rect_inner: [ il, it, ir, ib ], rect_outer: [ ol, ot, or_, ob ] } = computeBoxLayout(children, { padding, margin, aspect, adjust })
    const fw = (ir - il) * (or_ - ol)
    const fh = (ib - it) * (ob - ot)
    const top = ot + it * (ob - ot)
    const width = fw > 0 ? inner.width / fw : inner.width
    const height = fh > 0 ? inner.height / fh : inner.height
    return make_em({ width, height, anchor: top * height + inner.anchor, scale: inner.scale })
}

//
// text line and block
//

interface TextLineArgs extends GroupArgs {
    padding?: number
    justify?: AlignValue
    width?: number
}

class TextLine extends Group {
    em: EmSpec

    constructor(args: TextLineArgs = {}) {
        const { children: children0, padding, justify = 'left', width, debug, env, ...attr } = THEME(args, 'TextLine')
        const children = ensure_children(children0)
        const line = new HStack({ children, spacing: padding, align: justify, debug, env })
        super({ children: [ line ], aspect: width ?? line.spec.aspect, env, ...attr })
        this.args = args

        // one line: as wide as its width (or its content), one em tall
        this.em = make_em({ width: width ?? line.spec.aspect ?? 1, height: 1, anchor: TEXT_ANCHOR })
    }
}

interface TextArgs extends StackArgs {
    font_family?: string
    font_weight?: number
    font_style?: string
    width?: number  // the width in em to wrap at (none: a single line)
    scale?: number  // own em over the parent's em
}

// wrap text or elements to multiple lines with fixed line height
class Text extends VStack {
    spans: Element[]
    em: EmSpec

    constructor(args: TextArgs = {}) {
        const { children: children0, width, scale = 1, spacing, padding, justify, debug, env, ...attr0 } = THEME(args, 'Text')
        const children = ensure_children(children0)
    	const [ spec, attr ] = spec_split(attr0)

        // split into words and elements
        const spans = compress_spans(children, { env, ...attr })

        // wrap text to line widths
        const measure = (span: Element) => span.spec.aspect ?? 1
        const { rows } = wrapWidths(spans, measure, width)

        // construct text lines
        const lines = rows.map(row =>
            new TextLine({ children: normalize_line(row), padding, justify, width, debug, env })
        )

        // pass to VStack
        super({ children: lines, spacing, even: true, env, ...spec })
        this.args = args

        // additional props
        this.spans = spans
        this.em = block_em(width ?? this.spec.aspect ?? 1, this.spec.aspect, scale)
    }
}

//
// text container classes
//

interface TextStackArgs extends StackArgs {
    width?: number
    scale?: number
}

// a stack of text blocks, each stretched to the stack's width (the given one,
// or the widest child's), so a child with a narrower width comes out larger
class TextStack extends VStack {
    em: EmSpec

    constructor(args: TextStackArgs = {}) {
        const { children: children0, width, scale = 1, justify = 'left', ...attr0 } = THEME(args, 'TextStack')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children = ensure_children(children0)

        // apply width and justify to the text children, unless they set their
        // own (a narrower width makes larger text, which is how headings are
        // made; a child's `scale` is the same thing said the other way round);
        // other elements take the width of the stack as they are; a stack with
        // no width leaves its children's alone
        const elems = children.map((c: Element) => {
            const { width: cwidth, scale: cscale, justify: justify0 } = c.args ?? {}
            const width_child = cwidth ?? ((cscale != null && width != null) ? width / cscale : width)
            const size_attr = (is_text_sized(c) && width_child != null) ? { width: width_child } : {}
            const elem = c.clone({ ...font_attr, ...text_attr, ...size_attr, justify: justify0 ?? justify })
            return width != null ? place_em_child(elem, width, justify0 ?? justify) : elem
        })

        // pass to VStack
        super({ children: elems, ...attr })
        this.args = args

        // every child spans the stack's width; the height follows from the
        // stack's aspect and the anchor is the first child's
        const stack_width = width ?? max(elems.map(e => child_em(e).width)) ?? 1
        const anchor = elems.length > 0 ? slot_anchor(elems[0], stack_width) : 0
        this.em = block_em(stack_width, this.spec.aspect, scale, anchor)
    }
}

interface TextBoxArgs extends BoxArgs {
    justify?: AlignValue
    width?: number
    scale?: number
}

class TextBox extends Box {
    em: EmSpec

    constructor(args: TextBoxArgs = {}) {
        const { children, padding = 0.1, justify, width, scale, env, ...attr0 } = THEME(args, 'TextBox')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const text = new Text({ children, justify, width, scale, env, ...text_attr, ...font_attr })
        super({ children: [ text ], padding, env, ...attr })
        this.args = args

        // the text's box grown by the padding (and margin) the Box applied
        const { margin, aspect, adjust } = attr as BoxArgs
        this.em = box_em(text.em, [ text ], { padding, margin, aspect: aspect as number | undefined, adjust, env })
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
    width?: number
    scale?: number
    marker?: string | Element
    indent?: number
    gap?: number
    font_family?: string
    font_weight?: number
    font_style?: string
}

// the width an item is laid out at in a list body `width` wide: its own em is
// `scale` times the list's, if it says so
function item_width(child: Element, width: number): number {
    const { scale } = child.args ?? {}
    return scale != null ? width / scale : width
}

// a bulleted list: each item is a Text wrapped to the body width with a marker
// in the indent, level with its first line. nested Bullets are indented without
// a marker. widths are in em so the text size matches surrounding text with the
// same width; the gap between items is also in em
class Bullets extends VStack {
    em: EmSpec

    constructor(args: BulletsArgs = {}) {
        const { children: children0, width = 25, scale = 1, marker: marker0 = '•', indent = 0.75, gap = 0.5, spacing: spacing0, justify = 'left', env, ...attr0 } = THEME(args, 'Bullets')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children: any[] = ensure_children(children0)

        // the body is narrower than the list by the indent
        const width_body = width - indent
        if (width_body <= 0) throw new Error(`Bullets indent (${indent}) must be less than width (${width})`)

        // the indent is a fixed fraction of each row, so it never sets the row
        // height. the marker sits in a one-line box (indent em by one em) at
        // the top of the indent: level with the first line of the body, or
        // shrunk to the row when the body is shorter than a line. a body with
        // metrics whose first line's axis is not the list's (a scaled item)
        // has the marker moved to meet it
        const cell = { stack_size: indent / width }
        const marker: Element = is_element(marker0) ? marker0 : new Text({ children: [ marker0 ] as any, align: ['left', 'center'], env, ...font_attr })
        const mark0 = new Group({ children: [ marker ], aspect: indent, align: [ 'center', 'top' ], env, ...cell })
        const make_mark = (body: Element): Element => {
            const aspect_body = body.spec.aspect
            const height = (aspect_body != null && aspect_body > 0) ? width_body / aspect_body : null
            const dy = (body as WithEm).em != null ? slot_anchor(body, width_body) - TEXT_ANCHOR : 0
            if (height == null || height < 1 || dy == 0) return mark0
            const shifted = marker.clone({ rect: [ 0, dy / height, 1, (dy + 1) / height ], align: [ 'center', 'top' ] })
            return new Group({ children: [ shifted ], aspect: indent / height, env, ...cell })
        }

        // build item rows
        const bodies: Element[] = []
        const rows = children.map((child: any) => {
            // sublists are indented but get no marker
            if (child instanceof Bullets) {
                const sub = child.clone({ width: item_width(child, width_body), justify, ...font_attr, ...text_attr })
                bodies.push(sub)
                return new HStack({ children: [ new Spacer({ env, ...cell }), sub ], env })
            }

            // wrap text items to the body width; a formula is placed at the
            // text's em, and any other element spans the body as it is
            const body: Element = child instanceof Text ? child.clone({ width: item_width(child, width_body), justify, ...font_attr, ...text_attr }) : place_em_child(child, width_body, justify)
            bodies.push(body)
            return new HStack({ children: [ make_mark(body), body ], env })
        })

        // convert the gap in em into a stack spacing fraction
        const heights = rows.map(r => r.spec.aspect != null ? width / r.spec.aspect : 0)
        const content = sum(heights)
        const gaps = gap * Math.max(rows.length - 1, 0)
        const spacing = spacing0 ?? (content + gaps > 0 ? gaps / (content + gaps) : 0)

        // pass to VStack
        super({ children: rows, spacing, justify, env, ...attr })
        this.args = args

        // the list is `width` wide; the first item's body sits at the top of
        // its row, so its anchor is the list's
        const anchor = bodies.length > 0 ? slot_anchor(bodies[0], width_body) : 0
        this.em = block_em(width, this.spec.aspect, scale, anchor)
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
