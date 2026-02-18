// slide elements

import { THEME } from '../lib/theme'

import { prefix_split, spec_split } from './core'
import { Box } from './layout'
import { TextFrame, TextStack } from './text'

import type { AlignValue, Padding, Rounded, Point, Size } from '../lib/types'
import type { BoxArgs } from './layout'

//
// title/slide classes
//

interface TitleBoxArgs extends BoxArgs {
    title?: string
    title_size?: number
    title_fill?: string
    title_offset?: number
    title_rounded?: number
}

// TODO: use mask to clip frame for title box (then we can make it transparent)
// TODO: title doesn't get rotated on spin
class TitleBox extends Box {
    constructor(args: TitleBoxArgs = {}) {
        const { children, title, title_size = 0.05, title_fill, title_offset = 0, title_rounded = 0.1, margin, ...attr0 } = THEME(args, 'TitleBox')
        const [ title_attr, attr1 ] = prefix_split(['title'], attr0)
        const [ spec, attr ] = spec_split(attr1)

        // make inner box
        const box = new Box({ children, ...attr })

        // make optional title box
        let title_box: TextFrame | null = null
        if (title != null) {
            const title_pos: Point = [ 0.5, title_size * title_offset ]
            const title_rad: Size = [ 0.5, title_size ]
            title_box = new TextFrame({ children: title, pos: title_pos, rad: title_rad, fill: title_fill, rounded: title_rounded, ...title_attr })
        }

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
        const { children, aspect, padding = 0.1, margin = 0.1, border = 1, rounded = 0.01, border_stroke = '#bbb', title_size = 0.05, wrap = 25, spacing = 0.05, justify = 'left', ...attr0 } = THEME(args, 'Slide')
        const [ text_attr, attr ] = prefix_split([ 'text' ], attr0)

        // stack up children
        const stack = new TextStack({ children, spacing, justify, wrap, ...text_attr })

        // pass to TitleFrame
        super({ children: stack, aspect, padding, margin, border, rounded, border_stroke, title_size, ...attr })
        this.args = args
    }
}

//
// exports
//

export { TitleBox, TitleFrame, Slide }
export type { TitleBoxArgs, TitleFrameArgs, SlideArgs }
