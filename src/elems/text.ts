// text elements

import type { Attrs, AlignValue } from '../lib/types'
import { THEME } from '../lib/theme'
import { none, bold, vtext } from '../lib/const'
import { check_string, is_scalar, is_string, compress_whitespace, rect_box, check_singleton } from '../lib/utils'
import { textMetrics, splitWords } from '../lib/text'

import { Context, Element, Group, prefix_split, prefix_join, spec_split, ensure_children } from './core'
import type { ElementArgs, GroupArgs } from './core'
import { Box, HWrap, VStack } from './layout'
import type { BoxArgs, HWrapArgs, StackArgs } from './layout'

//
// span class
//

function escape_xml(text: string): string {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function ensure_tail(text: string): string {
    return `${text.trimEnd()} `
}

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
class Span extends Element {
    text: string
    vshift: number
    vsize: number
    vcenter: number

    constructor(args: SpanArgs = {}) {
        const { children: children0, color, vshift = vtext, stroke = none, ...attr0 } = THEME(args, 'Span')
        const text0 = check_string(children0)
        const [ font_attr0, attr ] = prefix_split([ 'font' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // compress whitespace, since that's what SVG does
        const text = compress_whitespace(text0)
        const { advance, ascent, descent } = textMetrics(text, font_attr)
        const vsize = Math.max(1, ascent - descent)
        const vcenter = (ascent + descent) / (2 * vsize)
        const aspect = advance / vsize

        // pass to element
        super({ tag: 'text', unary: false, aspect, fill: color, stroke, ...font_attr, ...attr })
        this.args = args

        // additional props
        this.text = escape_xml(text)
        this.vshift = vshift
        this.vsize = vsize
        this.vcenter = vcenter
    }

    // because text will always be displayed upright,
    // we need to find the ordered bounds of the text
    // and then offset it by the given offset
    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { vshift, vsize, vcenter } = this
        const size = (this as any).size as number | undefined
        const { prect } = ctx

        // get position and size
        let [ x0, y0, _w0, h0 ] = rect_box(prect, true)
        const voffset = (vsize > 1) ? vshift + (vcenter - 0.25) : vshift
        const yoff = voffset * h0
        const h = size ?? (h0 / vsize)

        // get display position
        const [ x1, y1 ] = [ x0, y0 + h0 ]
        const [ x, y ] = [ x1, y1 + yoff ]

        // get adjusted size
        return { x, y, font_size: `${h}px`, ...attr }
    }

    inner(_ctx: Context): string {
        return this.text
    }
}

interface ElemSpanArgs extends GroupArgs {
    spacing?: number
}

class ElemSpan extends Group {
    constructor(args: ElemSpanArgs = {}) {
        const { children: children0, spacing = 0.25, ...attr } = args
        const child0 = check_singleton(children0)
        const aspect0 = child0.spec.aspect ?? 1
        const aspect = aspect0 + spacing
        const child = child0.clone({ align: 'left' })
        super({ children: [ child ], aspect, ...attr })
    }
}

//
// text class
//

function compress_spans(children: Element[], font_args: Attrs = {}): any[] {
    return children.flatMap((child: any, i: number) => {
        const first_child = i == 0
        const last_child = i == children.length - 1

        // convert scalars to strings
        if (is_scalar(child)) child = child.toString()

        // process strings into Span's
        // process Text into Span's
        // process Spans into Span's (with args)
        // process Elements into ElemSpan's
        if (is_string(child)) {
            let text = compress_whitespace(child)
            if (first_child) text = text.trimStart()
            if (!last_child) text = ensure_tail(text)
            if (last_child) text = text.trimEnd()
            const words = splitWords(text)
            return words.map((w: string) => new Span({ children: [ w ], ...font_args }))
        } else if (child instanceof Text) {
            return child.spans.map((s: any, i: number) => {
                if (!(s instanceof Span)) return s
                let { text } = s
                if (i == 0 && first_child) text = text.trimStart()
                if (i == child.spans.length - 1 && !last_child) text = ensure_tail(text)
                if (i == child.spans.length - 1 && last_child) text = text.trimEnd()
                return s.clone({ children: [ text ], ...font_args })
            })
        } else if (child instanceof Span) {
            let { text } = child
            if (first_child) text = text.trimStart()
            if (!last_child) text = ensure_tail(text)
            if (last_child) text = text.trimEnd()
            const child1 = child.clone({ children: [ text ], ...font_args })
            return [ child1 ]
        } else {
            const child1 = (child instanceof ElemSpan) ? child : new ElemSpan({ children: [ child ] })
            return [ child1 ]
        }
    })
}

interface TextArgs extends HWrapArgs {
    font_family?: string
    font_weight?: number
    font_style?: string
}

// wrap text or elements to multiple lines with fixed line height
class Text extends HWrap {
    spans: any[]

    constructor(args: TextArgs = {}) {
        const { children: children0, wrap, spacing, padding, justify, debug, ...attr0 } = THEME(args, 'Text')
        const children = ensure_children(children0)
    	const [ spec, attr ] = spec_split(attr0)

        // split into words and elements
        const spans = compress_spans(children, attr)

        // pass to HWrap
        super({ children: spans, spacing, padding, justify, wrap, debug, ...spec })
        this.args = args

        // additional props
        this.spans = spans
    }
}

//
// text container classes
//

interface TextStackArgs extends StackArgs {
    wrap?: number | null
    font_family?: string
    font_weight?: number
    text_wrap?: number
    text_justify?: string
}

class TextStack extends VStack {
    constructor(args: TextStackArgs = {}) {
        const { children: children0, wrap = null, justify = 'left', ...attr0 } = THEME(args, 'TextStack')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children = ensure_children(children0)

        // apply wrap to children
        const elems = children.map((c: Element) =>
            c.clone({ ...font_attr, ...text_attr, wrap, justify })
        )

        // pass to VStack
        super({ children: elems, ...attr })
        this.args = args
    }
}

interface TextBoxArgs extends BoxArgs {
    justify?: AlignValue
    wrap?: number
    font_family?: string
    font_weight?: number
    text_wrap?: number
    text_justify?: string
}

class TextBox extends Box {
    constructor(args: TextBoxArgs = {}) {
        const { children, padding = 0.1, justify, wrap, debug, ...attr0 } = THEME(args, 'TextBox')
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const text = new Text({ children, justify, wrap, debug, ...text_attr, ...font_attr })
        super({ children: [ text ], padding, debug, ...attr })
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

export { Span, ElemSpan, Text, TextStack, TextBox, TextFrame, Bold, Italic }
export type { SpanArgs, ElemSpanArgs, TextArgs, TextStackArgs, TextBoxArgs, TextFrameArgs }
