// slide elements

import { THEME } from '../lib/theme'
import { black, white, phi } from '../lib/const'
import { prefix_split, pad_rect } from '../lib/utils'

import { spec_split, align_frac, is_element, ensure_children, Rectangle, Group } from './core'
import { Box, Attach } from './layout'
import { RoundedRect } from './geometry'
import { Span, TextFrame, TextStack } from './text'

import type { AlignValue, Padding, Rounded, Point, Rect } from '../lib/types'
import type { Element } from './core'
import type { BoxArgs } from './layout'

//
// title/slide classes
//

interface LabelBoxArgs extends BoxArgs {
    label?: Element | string
}

class LabelBox extends Box {
    constructor(args: LabelBoxArgs = {}) {
        const { children: children0, label: label0, env, ...attr0 } = THEME(args, 'LabelBox')
        const [ label_attr, attr1 ] = prefix_split(['label'], attr0)
        const [ spec, attr ] = spec_split(attr1)
        const children = ensure_children(children0)

        // enclose children in a box
        const inner = new Box({ children, env, ...attr })

        // make optional label box
        let attach: Attach | null = null
        if (label0 != null) {
            const label = is_element(label0) ? label0 : new Span({ children: [ label0 ], env })
            attach = new Attach({ children: [ label ], env, ...label_attr })
        }

        // pass layout spec to the outer box, not the inner box
        super({ children: [ inner, attach ], env, ...spec })
        this.args = args
    }
}

interface TitleBoxArgs extends BoxArgs {
    title?: Element | string
    title_size?: number
    title_fill?: string
    title_offset?: number
    title_rounded?: number
}

class TitleBox extends Box {
    constructor(args: TitleBoxArgs = {}) {
        const { children, title, title_size = 0.1, title_offset = 0, title_rounded = 0.1, margin, env, ...attr0 } = THEME(args, 'TitleBox')
        const [ title_attr, attr1 ] = prefix_split(['title'], attr0)
        const [ spec, attr ] = spec_split(attr1)

        // make optional title box
        let title_box: TextFrame | null = null
        let title_mask: Element | undefined = undefined
        if (title != null) {
            const title_pos: Point = [ 0.5, title_size * title_offset ]
            const title_span = is_element(title) ? title : new Span({ children: [ title ], env })
            title_box = new TextFrame({ children: [ title_span ], pos: title_pos, ysize: title_size, rounded: title_rounded, env, ...title_attr })
            title_mask = new Group({ children: [
                new Rectangle({ x: '0%', y: '0%', width: '100%', height: '100%', fill: white, env }),
                new RoundedRect({ pos: title_pos, ysize: title_size, aspect: title_box.spec.aspect, rounded: title_rounded, fill: black, env })
            ], fill_rule: 'evenodd' , env})
        }

        // make inner box; when the outer box is given a shape (aspect or flex)
        // the inner box fills it rather than hugging the content
        const sized = spec.flex === true || spec.aspect != null
        const box = new Box({ children, mask: title_mask, flex: sized, env, ...attr })

        // pass to Box for margin
        super({ children: [ box, title_box ], margin, env, ...spec })
        this.args = args
    }
}

interface TitleFrameArgs extends TitleBoxArgs {
    border?: number
}

class TitleFrame extends TitleBox {
    constructor(args: TitleFrameArgs = {}) {
        const { border = 1, ...attr } = THEME(args, 'TitleFrame')
        super({ border, ...attr })
        this.args = args
    }
}

interface SlideArgs extends TitleFrameArgs {
    aspect?: number | 'auto'
    padding?: Padding
    margin?: Padding
    rounded?: Rounded
    border_stroke?: string
    background?: string
    wrap?: number
    spacing?: number
    justify?: AlignValue
    valign?: AlignValue
}

// convert a padding given in units of the outer height into the inner-relative
// fractions that Box uses with adjust = false, and return the inner aspect
function canvas_padding(pad: Padding | undefined, aspect: number): { padding: Rect, aspect: number } {
    const [ l, t, r, b ] = pad_rect(pad)
    const w = aspect - l - r
    const h = 1 - t - b
    if (w <= 0 || h <= 0) throw new Error(`Slide padding/margin too large for aspect ${aspect}`)
    return { padding: [ l / w, t / h, r / w, b / h ], aspect: w / h }
}

// a slide is a fixed-aspect canvas (16:9 by default) holding a TitleFrame that
// fills it inside the margin; margin and padding are fractions of the slide
// height, so they are the same distance in every direction. content is a
// TextStack embedded in the frame's padded area: it fills the width when it
// fits and is shrunk to fit the height when it does not (see `overflow`)
class Slide extends Box {
    // ratio of content height to the available height (> 1 means it was shrunk)
    overflow: number

    constructor(args: SlideArgs = {}) {
        const {
            children, aspect: aspect0, padding = 0.1, margin = 0.05, border = 1, rounded = 0.01,
            border_stroke = '#bbb', background, title_size = 0.1, wrap = 25, spacing = 0.05,
            justify = 'left', align, env, ...attr0
        } = THEME(args, 'Slide')
        const [ text_attr, attr1 ] = prefix_split([ 'text' ], attr0)
        const [ spec, attr ] = spec_split(attr1)
        const aspect = aspect0 == 'auto' ? undefined : aspect0

        // stack up content, aligned within the content area
        const stack = new TextStack({ children, spacing, justify, wrap, align, env, ...text_attr })

        // the frame flexes to fill the canvas inside the margin
        const frame = new TitleFrame({
            env,
            children: [ stack ], aspect, padding,
            border, rounded, border_stroke, title_size, ...attr
        })

        // the canvas is the slide itself: fixed aspect with the margin inside it
        super({ children: [ frame ], padding: margin, fill: background, env, ...spec })
        this.args = args

        // content taller than the area gets scaled down to fit the height
        const { aspect: aspect_stack } = stack.spec
        this.overflow = (aspect != null && aspect_stack != null) ? aspect / aspect_stack : 1
    }
}

//
// exports
//

export { LabelBox, TitleBox, TitleFrame, Slide }
export type { LabelBoxArgs, TitleBoxArgs, TitleFrameArgs, SlideArgs }
