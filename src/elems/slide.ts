// slide elements

import { THEME } from '../lib/theme'
import { black, white } from '../lib/const'
import { prefix_split } from '../lib/utils'

import { spec_split, is_element, ensure_children, Rectangle, Group } from './core'
import { Box, Attach } from './layout'
import { RoundedRect } from './geometry'
import { Span, TextFrame, TextStack } from './text'

import type { AlignValue, Padding, Rounded, Point } from '../lib/types'
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
        const { children: children0, label: label0, ...attr0 } = THEME(args, 'LabelBox')
        const [ label_attr, attr1 ] = prefix_split(['label'], attr0)
        const [ spec, attr ] = spec_split(attr1)
        const children = ensure_children(children0)

        // enclose children in a box
        const inner = new Box({ children, ...attr })

        // make optional label box
        let attach: Attach | null = null
        if (label0 != null) {
            const label = is_element(label0) ? label0 : new Span({ children: [ label0 ] })
            attach = new Attach({ children: [ label ], ...label_attr })
        }

        // pass layout spec to the outer box, not the inner box
        super({ children: [ inner, attach ], ...spec })
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
        const { children, title, title_size = 0.1, title_offset = 0, title_rounded = 0.1, margin, ...attr0 } = THEME(args, 'TitleBox')
        const [ title_attr, attr1 ] = prefix_split(['title'], attr0)
        const [ spec, attr ] = spec_split(attr1)

        // make optional title box
        let title_box: TextFrame | null = null
        let title_mask: Element | undefined = undefined
        if (title != null) {
            const title_pos: Point = [ 0.5, title_size * title_offset ]
            const title_span = is_element(title) ? title : new Span({ children: [ title ] })
            title_box = new TextFrame({ children: [ title_span ], pos: title_pos, ysize: title_size, rounded: title_rounded, ...title_attr })
            title_mask = new Group({ children: [
                new Rectangle({ x: '0%', y: '0%', width: '100%', height: '100%', fill: white }),
                new RoundedRect({ pos: [ 0.5, 0 ], ysize: title_size, aspect: title_box.spec.aspect, rounded: title_rounded, fill: black })
            ], fill_rule: 'evenodd' })
        }

        // make outer box
        const box = new Box({ children, mask: title_mask, ...attr })

        // pass to Box for margin
        super({ children: [ box, title_box ], margin, ...spec })
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
    padding?: Padding
    margin?: Padding
    rounded?: Rounded
    border_stroke?: string
    wrap?: number
    spacing?: number
    justify?: AlignValue
}

class Slide extends TitleFrame {
    constructor(args: SlideArgs = {}) {
        const { children, aspect, padding = 0.1, margin = 0.1, border = 1, rounded = 0.01, border_stroke = '#bbb', title_size = 0.1, wrap = 25, spacing = 0.05, justify = 'left', ...attr0 } = THEME(args, 'Slide')
        const [ text_attr, attr ] = prefix_split([ 'text' ], attr0)

        // stack up children
        const stack = new TextStack({ children, spacing, justify, wrap, ...text_attr })

        // pass to TitleFrame
        super({ children: [ stack ], aspect, padding, margin, border, rounded, border_stroke, title_size, ...attr })
        this.args = args
    }
}

//
// exports
//

export { LabelBox, TitleBox, TitleFrame, Slide }
export type { LabelBoxArgs, TitleBoxArgs, TitleFrameArgs, SlideArgs }
