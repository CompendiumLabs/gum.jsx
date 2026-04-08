// pixel images

import { Element, Context, type ElementArgs } from './core'
import { rect_box, is_string } from '../lib/utils'
import { THEME } from '../lib/theme'
import { type Attrs } from '../lib/types'

function splitOuterSvg(svg: string): { attrsText: string, inner: string } {
    // find first <svg> tag
    const openStart = svg.indexOf('<svg')
    if (openStart < 0) {
        throw new Error('SvgImage expected an <svg> start tag opening')
    }
    const openStop = svg.indexOf('>', openStart)
    if (openStop < 0) {
        throw new Error('SvgImage expected an <svg> start tag closing')
    }

    // get attributes text
    const openTag = svg.slice(openStart, openStop + 1)
    const attrsText = openTag
        .replace(/^<svg\b/i, '')
        .replace(/\/?>$/, '')
        .trim()

    // weird case <svg/> but ok
    if (openTag.endsWith('/>')) {
        return { attrsText, inner: '' }
    }

    // find last </svg> tag
    const closeStart = svg.lastIndexOf('</svg>')
    if (closeStart < 0 || closeStart < openStop) {
        throw new Error('SvgImage expected an <svg> end tag')
    }
    const inner = svg.slice(openStop + 1, closeStart)

    // return text split
    return { attrsText, inner }
}

function parseSvgAttrs(attrsText: string): Attrs {
    const pairs = attrsText.matchAll(/(\w[\w:-]*)(?:\s*=\s*("[^"]*"|'[^']*'))?/g)
    const entries = Array.from(pairs,
        ([ _, key, val0 ]) => [ key, val0 ? val0.slice(1, -1) : true ] as [ string, string | boolean ]
    )
    return Object.fromEntries(entries)
}

function getSvgAspect(attr: Attrs): number | undefined {
    const { width: widthStr, height: heightStr, viewBox: viewBoxStr } = attr

    // infer from width/height first
    if (widthStr != null && heightStr != null) {
        const width = Number(widthStr)
        const height = Number(heightStr)
        return height != 0 ? width / height : undefined
    }

    // infer from viewBox second
    if (viewBoxStr != null) {
        const [ _x, _y, width, height ] = viewBoxStr.split(' ').map(Number)
        return height != 0 ? width / height : undefined
    }

    // no aspect found
    return undefined
}

// read bytes 16-24 (24 * 8 = 192 bits)
// base64: cut to 32 * 6 = 192 bits
function calcPngAspect(data: string): number {
    const [_type, base64] = data.split(',')
    const bstring = atob(base64.slice(0, 32))
    const array = Uint8Array.from(bstring, (c) => c.charCodeAt(0))
    const view = new DataView(array.buffer)
    const width = view.getUint32(16)
    const height = view.getUint32(20)
    return width / height
}

type PngImageData = string | {
    aspect: number
    data: string
}

// base64 image url (data:image/png;base64,...)
interface PngImageArgs extends ElementArgs {
    data?: PngImageData
}

// png data URI image
class PngImage extends Element {
    constructor(args: PngImageArgs = {}) {
        const { data: data0, aspect: aspect0, ...attr } = THEME(args, 'Image')

        // image data is required
        if (data0 == null) throw new Error('Image data is required')

        // get dataUrl and aspect
        const data = is_string(data0) ? data0 : data0.data
        const aspect = aspect0 ?? (is_string(data0) ? calcPngAspect(data0) : data0.aspect)

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

interface SvgImageArgs extends ElementArgs {
    data?: string
}

class SvgImage extends Element {
    innerSvg: string

    constructor(args: SvgImageArgs = {}) {
        const { data, ...attr } = THEME(args, 'Image')

        // image data is required
        if (data == null) throw new Error('SvgImage data is required')

        // parse into attributes and inner svg
        const { attrsText, inner } = splitOuterSvg(data)
        const svgAttr = parseSvgAttrs(attrsText)

        // get aspect from width/height or viewBox
        const aspect = getSvgAspect(svgAttr)

        // width/height come from mapped context
        delete svgAttr.width
        delete svgAttr.height

        super({ tag: 'svg', unary: false, aspect, ...svgAttr, ...attr })
        this.args = args
        this.innerSvg = inner
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { prect } = ctx
        const [ x, y, w, h ] = rect_box(prect, true)
        return { ...attr, x, y, width: w, height: h }
    }

    inner(_ctx: Context): string {
        return this.innerSvg
    }
}

export { PngImage, SvgImage, calcPngAspect }
