// text elements

import type { Attrs, AlignValue } from '../lib/types'
import { THEME } from '../lib/theme'
import { vtext, none, bold } from '../lib/const'
import { ensure_array, check_string, is_scalar, is_string, compress_whitespace, sum, max, rounder, rect_box, rect_center, check_singleton } from '../lib/utils'
import { textSizer, wrapText, splitWords } from '../lib/text'
import { mathjax } from '../lib/math'

import { Context, Element, Group, prefix_split, prefix_join, spec_split } from './core'
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
    children?: any
    color?: string
    voffset?: number
    stroke?: string
    font_family?: string
    font_weight?: number
    font_style?: string
}

// no wrapping at all, clobber newlines, mainly internal use
class Span extends Element {
    text: string
    voffset: number

    constructor(args: SpanArgs = {}) {
        const { children: children0, color, voffset = vtext, stroke = none, ...attr0 } = THEME(args, 'Span')
        const child = check_string(children0)
        const [ font_attr0, attr ] = prefix_split([ 'font' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // compress whitespace, since that's what SVG does
        const text = compress_whitespace(child)
        const width = textSizer(text, font_attr)

        // pass to element
        super({ tag: 'text', unary: false, aspect: width, fill: color, stroke, ...font_attr, ...attr })
        this.args = args

        // additional props
        this.text = escape_xml(text)
        this.voffset = voffset
    }

    // because text will always be displayed upright,
    // we need to find the ordered bounds of the text
    // and then offset it by the given offset
    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { voffset } = this
        const size = (this as any).size as number | undefined
        const { prect } = ctx

        // get position and size
        let [ x0, y0, w0, h0 ] = rect_box(prect, true)
        const yoff = voffset * h0
        const h = size ?? h0

        // get display position
        const [ x1, y1 ] = [ x0, y0 + h0 ]
        const [ x, y ] = [ x1, y1 + yoff ]

        // get adjusted size
        return { x, y, font_size: `${h}px`, ...attr }
    }

    inner(ctx: Context): string {
        return this.text
    }
}

interface ElemSpanArgs extends GroupArgs {
    spacing?: number
}

class ElemSpan extends Group {
    constructor(args: ElemSpanArgs = {}) {
        const { children: children0, spacing = 0.25, ...attr } = args
        const children = check_singleton(children0)
        const aspect0 = children.spec.aspect ?? 1
        const aspect = aspect0 + spacing
        const child = children.clone({ align: 'left' })
        super({ children: child, aspect, ...attr })
    }
}

//
// text class
//

function compress_spans(children: any[], font_args: Attrs = {}): any[] {
    return children.flatMap((child: any, i: number) => {
        const first_child = i == 0
        const last_child = i == children.length - 1

        // convert scalars to strings
        if (is_scalar(child)) child = child.toString()

        // process strings into Span
        // process Text into Span's
        if (is_string(child)) {
            if (first_child) child = child.trimStart()
            if (!last_child) child = ensure_tail(child)
            if (last_child) child = child.trimEnd()
            const words = splitWords(child)
            return words.map((w: string) => new Span({ children: w, ...font_args }))
        } else if (child instanceof Text) {
            return child.spans.map((s: any, i: number) => {
                if (!(s instanceof Span)) return s
                let { text } = s
                if (i == 0 && first_child) text = text.trimStart()
                if (i == child.spans.length - 1 && !last_child) text = ensure_tail(text)
                if (i == child.spans.length - 1 && last_child) text = text.trimEnd()
                return s.clone({ children: text, ...font_args })
            })
        } else if (child instanceof Span) {
            let { text } = child
            if (first_child) text = text.trimStart()
            if (!last_child) text = ensure_tail(text)
            if (last_child) text = text.trimEnd()
            return child.clone({ children: text, ...font_args })
        } else {
            return (child instanceof ElemSpan) ? child : new ElemSpan({ children: child })
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
        const { children: children0, wrap, spacing = 0.1, padding = 0, justify = 'left', debug, ...attr0 } = THEME(args, 'Text')
        const items = ensure_array(children0)
    	const [ spec, attr ] = spec_split(attr0)

        // split into words and elements
        const spans = compress_spans(items, attr)

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
        const items = ensure_array(children0)
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // apply wrap to children
        const children = items.map((c: any) => c.clone({ ...font_attr, ...text_attr, wrap, justify }))

        // pass to VStack
        super({ children, ...attr })
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
        const { children: children0, padding = 0.1, justify, wrap, debug, ...attr0 } = THEME(args, 'TextBox')
        const text = ensure_array(children0)
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children = new Text({ children: text, justify, wrap, debug, ...text_attr, ...font_attr })
        super({ children, padding, debug, ...attr })
        this.args = args
    }
}

interface TextFrameArgs extends TextBoxArgs {
    border?: number
    rounded?: number
}

class TextFrame extends TextBox {
    constructor(args: TextFrameArgs = {}) {
        const { border = 1, rounded = 0.05, ...attr } = THEME(args, 'TextFrame')
        super({ border, rounded, ...attr })
    }
}

//
// text flex class
//

// TODO: This isn't perfect. Need to handle impossible cases.
// calculate font-size within box, iterative but still BlooP!
function get_font_size(text: string, w: number, h: number, spacing: number, fargs: Attrs): number | undefined {
    // best guess font size
    const tw = textSizer(text, fargs)
    const lw = ( tw! * h ) / w
    const { rows } = wrapText(text, lw, fargs)
    const nmin = rows.length
    const nmax = sum(rows.map(l => l.length))

    // account for ragged newlines
    for (let n = nmin; n <= nmax; n++) {
        const fs = h / ( n + (n - 1) * spacing )
        const lw = w / fs
        const { widths } = wrapText(text, lw, fargs)
        if (widths.length <= n) {
            const mw = max(widths) ?? 0
            return fs * mw < w ? fs : w / mw
        }
    }
}

interface TextFlexArgs extends ElementArgs {
    children?: any
    font_scale?: number
    font_size?: number
    spacing?: number
    color?: string
    voffset?: number
}

// text fits outer shape
// font_scale is proportionally scaled
// font_size is absolutely scaled
class TextFlex extends Element {
    text: string
    voffset: number
    spacing: number
    font_scale: number | undefined
    font_size: number | undefined
    font_args: Attrs

    constructor(args: TextFlexArgs = {}) {
        const { children: children0, font_scale, font_size, spacing = 0.1, color, voffset = vtext, ...attr0 } = THEME(args, 'TextFlex')
        const children = check_string(children0)
        const [ font_attr0, attr ] = prefix_split([ 'font' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // pass to Element
        super({ tag: 'g', unary: false, stroke: color, fill: color, ...attr })
        this.args = args

        // additional props
        this.text = children
        this.voffset = voffset
        this.spacing = spacing
        this.font_scale = font_scale
        this.font_size = font_size
        this.font_args = font_attr
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        return { ...this.font_args, ...attr }
    }

    inner(ctx: Context): string {
        const { prect } = ctx
        const [ x, y, w, h ] = rect_box(prect)

        // handle font size specification
        let fs: number | undefined = undefined
        if (this.font_size != null) {
            fs = this.font_size
        } else if (this.font_scale != null) {
            fs = this.font_scale * h
        } else {
            fs = get_font_size(this.text, w, h, this.spacing, this.font_args)
        }
        const lh = fs! * ( 1 + this.spacing )

        // compute wrapped rows
        const mw = w / fs!
        const { rows } = wrapText(this.text, mw, this.font_args)
        const lines = rows.map((r: string[]) => r.join(' '))

        // map line indices to positions
        const y1 = y + ( 1 + this.voffset ) * fs!
        const elems = lines.map((r: string, i: number) => `<tspan x="${x}" y="${y1 + i * lh}">${r}</tspan>`)
        return `<text font-size="${fs}">\n${elems.join('\n')}\n</text>`
    }
}

class Bold extends Text {
    constructor(args: TextArgs = {}) {
        const { ...attr } = THEME(args, 'Bold')
        super({ font_weight: bold, ...attr })
    }
}

class Italic extends Text {
    constructor(args: TextArgs = {}) {
        const { ...attr } = THEME(args, 'Italic')
        super({ font_style: 'italic', ...attr })
    }
}

//
// latex classes
//

interface LatexArgs extends ElementArgs {
    children?: any
    display?: boolean
    voffset?: number
}

// TODO: this is slow. can we get katex back somehow?
class Latex extends Element {
    math: string
    vshift: number

    constructor(args: LatexArgs = {}) {
        const { children, display = false, voffset = vtext, ...attr } = THEME(args, 'Latex')
        const tex = check_string(children)

        // render with mathjax (or do nothing if mathjax is not available)
        let math = '', svg_attr: Attrs = {}, vshift = 0
        if (mathjax != null) {
            // render with mathjax
            const { svg, viewBox, width, height, valign } = mathjax.render(tex, { display })

            // handle vertical offset
            const vfactor = display ? 0.5 : 0.25
            const vshift0 = voffset + valign + vfactor * (1 - height)

            // immediate attributes
            svg_attr = {
                viewBox,
                aspect: width / height,
                preserveAspectRatio: 'none',
                'xmlns': 'http://www.w3.org/2000/svg',
            }

            // store for rendering
            math = svg
            vshift = vshift0
        } else {
            math = tex
        }

        // pass to element
        super({ tag: 'svg', unary: false, ...svg_attr, ...attr })
        this.args = args

        // additional props
        this.math = math
        this.vshift = vshift
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { prect } = ctx
        const [ x, y0, w, h ] = rect_box(prect, true)
        const y = y0 + this.vshift * h
        return { x, y, width: w, height: h, ...attr }
    }

    inner(ctx: Context): string {
        return `\n${this.math}\n`
    }
}

class Equation extends Latex {
    constructor(args: LatexArgs = {}) {
        const { ...attr } = THEME(args, 'Equation')
        super({ display: true, ...attr })
    }
}

//
// exports
//

export { Span, ElemSpan, Text, TextStack, TextBox, TextFrame, TextFlex, Bold, Italic, Latex, Equation }
export type { SpanArgs, ElemSpanArgs, TextArgs, TextStackArgs, TextBoxArgs, TextFrameArgs, TextFlexArgs, LatexArgs }
