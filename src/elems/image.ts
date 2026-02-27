// pixel images

import { Element, Context, type ElementArgs } from './core'
import { rect_box } from '../lib/utils'
import { THEME } from '../lib/theme'
import { type Attrs, type Size } from '../lib/types'

// read bytes 16-24 (24 * 8 = 192 bits)
// base64: cut to 32 * 6 = 192 bits
function getPngSize(data: string): Size {
    const [_type, base64] = data.split(',')
    const bstring = atob(base64.slice(0, 32))
    const array = Uint8Array.from(bstring, (c) => c.charCodeAt(0))
    const view = new DataView(array.buffer)
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return [ width, height ]
}

// base64 image url (data:image/png;base64,...)
interface ImageArgs extends ElementArgs {
    data?: string
}

// must be PNG for now
class Image extends Element {
    constructor(args: ImageArgs = {}) {
        const { data, ...attr } = THEME(args, 'Image')

        // image data is required
        if (data == null) throw new Error('Image data is required')

        // get dataUrl and aspect
        const [ width, height ] = getPngSize(data)
        const aspect = width / height

        // pass to Element
        super({ tag: 'image', unary: true, href: data, aspect, ...attr })
        this.args = args
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { prect } = ctx
        let [ x, y, w, h ] = rect_box(prect, true)
        return { x, y, width: w, height: h, ...attr }
    }
}

export { Image }
