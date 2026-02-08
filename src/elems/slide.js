// slide elements

import { THEME } from '../defaults.js'
import { ensure_array } from '../lib/utils.js'

import { prefix_split, spec_split } from './core.js'
import { Box } from './layout.js'
import { TextFrame, TextStack } from './text.js'

//
// slides
//

// TODO: use mask to clip frame for title box (then we can make it transparent)
// TODO: title doesn't get rotated on spin
class TitleBox extends Box {
    constructor(args = {}) {
        const { children: children0, title, title_size = 0.05, title_fill, title_offset = 0, title_rounded = 0.1, margin, ...attr0 } = THEME(args, 'TitleBox')
        const children = ensure_array(children0)
        const [ title_attr, attr1 ] = prefix_split(['title'], attr0)
        const [ spec, attr ] = spec_split(attr1)

        // make inner box
        const box = new Box({ children, ...attr })

        // make optional title box
        let title_box = null
        if (title != null) {
            const title_pos = [ 0.5, title_size * title_offset ]
            const title_rad = [ 0.5, title_size ]
            title_box = new TextFrame({ children: title, pos: title_pos, rad: title_rad, fill: title_fill, rounded: title_rounded, ...title_attr })
        }

        // pass to Box for margin
        super({ children: [ box, title_box ], margin, ...spec })
        this.args = args
    }
}

class TitleFrame extends TitleBox {
    constructor(args = {}) {
        const { border = 1, ...attr } = THEME(args, 'TitleFrame')
        super({ border, ...attr })
        this.args = args
    }
}

class Slide extends TitleFrame {
    constructor(args = {}) {
        const { children: children0, aspect, padding = 0.1, margin = 0.1, border = 1, rounded = 0.01, border_stroke = '#bbb', title_size = 0.05, wrap = 25, spacing = 0.05, justify = 'left', ...attr0 } = THEME(args, 'Slide')
        const children = ensure_array(children0)
        const [ text_attr, attr ] = prefix_split([ 'text' ], attr0)

        // stack up children
        const stack = new TextStack({ children, spacing, justify, wrap, ...text_attr })

        // pass to TitleFrame
        super({ children: stack, aspect, padding, margin, border, rounded, border_stroke, title_size, ...attr })
        this.args = args
    }
}

export { TitleBox, TitleFrame, Slide }
