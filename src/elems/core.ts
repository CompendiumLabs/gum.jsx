// core components

import { THEME } from '../lib/theme'
import { DEFAULTS as D, svgns, sans, light, blue, red, d2r } from '../lib/const'
import { is_scalar, abs, cos, sin, tan, cot, mul, maximum, minimum, filter_object, join_limits, flip_rect, expand_rect, rect_box, radial_rect, cbox_rect, rect_cbox, merge_points, ensure_array, ensure_vector, ensure_point, check_string, rounder, heavisign, abs_min, abs_max, rect_radial, rotate_aspect, remap_rect, rescaler, resizer } from '../lib/utils'

import type { Point, Rect, Limit, AlignValue, Align, Attrs, MPoint, MNumber, Spec } from '../lib/types'

//
// rect embedding
//

function align_frac(align: AlignValue): number {
    if (is_scalar(align)) {
        return align as number
    } else if (align == 'left' || align == 'top') {
        return 0
    } else if (align == 'center' || align == 'middle') {
        return 0.5
    } else if (align == 'right' || align == 'bottom') {
        return 1
    } else{
        throw new Error(`Unrecognized alignment specification: ${align}`)
    }
}

// embed a rect of given `aspect` into rect of given `size`
function embed_size(size: Point, { aspect, expand = false }: { aspect?: number, expand?: boolean } = {}): Point {
    if (aspect == null) return size
    const [ w0, h0 ] = size
    const [ aw, ah ] = [ abs(w0), abs(h0) ]
    const [ sw, sh ] = [ heavisign(w0), heavisign(h0) ]
    const agg = expand ? maximum : minimum
    const h = agg(aw / aspect, ah)
    const w = h * aspect
    return [ sw * w, sh * h ] as Point
}

// get the size of an `aspect` rect that will fit in `size` after `rotate`
function rotate_rect(size: Point, rotate: number, { aspect, expand = false, invar = false, tol = 0.001 }: { aspect?: number, expand?: boolean, invar?: boolean, tol?: number } = {}): Point {
    // knock out easy case
    if (rotate == 0 || invar) return embed_size(size, { aspect, expand })

    // unpack inputs
    const [ w0, h0 ] = size
    const theta = d2r * rotate

    // trig compute
    const COS = abs(cos(theta))
    const SIN = abs(sin(theta))

    // rotate rect
    let [ w, h ] = size
    if (aspect != null) {
        // this has an exact solution
        const DW = aspect * COS + SIN
        const DH = aspect * SIN + COS
        const agg = expand ? abs_max : abs_min
        h = agg(w0 / DW, h0 / DH)
        w = h * aspect
    } else {
        // this has some degeneracy, which we resolve with maximal area
        // max Area = w * h
        // st  C * w + S * h <= w0
        //     C * h + S * w <= h0
        const paspect = abs(w0 / h0)
        const TAN = abs(tan(theta))
        const COT = abs(cot(theta))
        const [ TL, TH ] = [ minimum(TAN, COT), maximum(TAN, COT) ]
        if (paspect < TL) {
            w = w0 / (2 * COS)
            h = w0 / (2 * SIN)
        } else if (paspect > TH) {
            w = h0 / (2 * SIN)
            h = h0 / (2 * COS)
        } else {
            const denom = COS * COS - SIN * SIN
            if (abs(denom) < tol) {
                // this uses a leontieff objective
                const t = abs_min(w0, h0) / (COS + SIN)
                w = h = t
            } else {
                w = (w0 * COS - h0 * SIN) / denom
                h = (h0 * COS - w0 * SIN) / denom
            }
        }
    }

    // return base and rotated rect sizes
    return [ w, h ] as Point
}

function rotate_repr(rotate: number, pos: Point, prec: number = D.prec): string {
    const [ x, y ] = pos
    return `rotate(${rounder(rotate, prec)}, ${rounder(x, prec)}, ${rounder(y, prec)})`
}

//
// context class
//

interface ContextArgs {
    prect?: Rect
    prec?: number
    coord?: Rect
    transform?: string
    meta?: Metadata
}

interface MapArgs {
    offset?: boolean
}

// context holds the current pixel rect and other global settings
// map() will create a new sub-context using rect in coord space
// map*() functions map from coord to pixel space (in prect)
class Context {
    args: ContextArgs
    prect: Rect
    coord: Rect
    prec: number
    meta: Metadata
    transform: string | undefined
    rescalex: (v: number | MNumber, offset?: boolean) => number
    rescaley: (v: number | MNumber, offset?: boolean) => number
    resizex: (v: number | MNumber, offset?: boolean) => number
    resizey: (v: number | MNumber, offset?: boolean) => number

    constructor(args: ContextArgs = {}) {
        const { prect = D.rect, coord = D.coord, transform, prec = D.prec, meta } = args
        this.args = args

        // coordinate transform
        this.prect = prect // drawing rect
        this.coord = coord // coordinate rect
        this.transform = transform // rotation transform

        // top level arguments
        this.prec = prec // string precision

        // percolated upwards
        this.meta = meta ?? new Metadata() // meta data

        // make rescaler / resizer
        // there are heavily used, so precompute what we can (haven't profiled yet)
        const [ cx1, cy1, cx2, cy2 ] = coord
        const [ px1, py1, px2, py2 ] = prect
        this.rescalex = rescaler([ cx1, cx2 ], [ px1, px2 ])
        this.rescaley = rescaler([ cy1, cy2 ], [ py1, py2 ])
        this.resizex = resizer([ cx1, cx2 ], [ px1, px2 ])
        this.resizey = resizer([ cy1, cy2 ], [ py1, py2 ])
    }

    clone(args: ContextArgs): Context {
        return new Context({ ...this.args, meta: this.meta, ...args })
    }

    // map point from coord to pixel
    mapPoint(cpoint: Point | MPoint, offset: boolean = true): Point {
        const [ cx, cy ] = cpoint
        return [ this.rescalex(cx, offset), this.rescaley(cy, offset) ]
    }

    // map rect from coord to pixel
    mapRect(crect: Rect, offset: boolean = true): Rect {
        const [ x1, y1, x2, y2 ] = crect
        return [
            this.rescalex(x1, offset), this.rescaley(y1, offset),
            this.rescalex(x2, offset), this.rescaley(y2, offset),
        ]
    }

    // map size from coord to pixel
    mapSize(csize: Point, offset: boolean = true): Point {
        const [ sw, sh ] = csize
        return [ this.resizex(sw, offset), this.resizey(sh, offset) ]
    }

    // NOTE: this is the main mapping function! be very careful when changing it!
    map({ rect, aspect, expand = false, align = 'center' as Align, rotate = 0, invar = false, offset = true, coord = D.coord } = {} as Spec & MapArgs): Context {
        // get true pixel rect (default to parent coord)
        const prect0 = this.mapRect(rect ?? this.coord, offset)
        const [ x0, y0, w0, h0 ] = rect_cbox(prect0)

        // rotate rect inside
        const [ w, h ] = rotate_rect([ w0, h0 ], rotate, { aspect, expand, invar })
        const transform = (rotate != null && rotate != 0) ? rotate_repr(rotate, [ x0, y0 ], this.prec) : undefined

        // broadcast align into [ halign, valign ] components
        const [ hafrac, vafrac ] = ensure_vector(align, 2).map(align_frac)
        const [ x, y ] = [
            x0 + (0.5 - hafrac) * (w - w0),
            y0 + (0.5 - vafrac) * (h - h0),
        ]

        // return new context
        const prect = cbox_rect([ x, y, w, h ])
        return new Context({ prect, coord, transform, prec: this.prec, meta: this.meta })
    }
}

//
// attributes
//

function demangle(k: string): string {
    return k.replace('_', '-')
}

function props_repr(d: Attrs, prec: number): string {
    return Object.entries(d)
        .filter(([_k, v]) => v != null)
        .map(([k, v]) => `${demangle(k)}="${rounder(v, prec)}"`)
        .join(' ')
}

// reserved keys
const SPEC_KEYS = [ 'rect', 'aspect', 'expand', 'align', 'rotate', 'invar', 'coord' ]
const HELP_KEYS = [ 'pos', 'rad', 'xlim', 'ylim', 'flex', 'spin', 'hflip', 'vflip', 'xrad', 'yrad' ]
const OTHER_KEYS = [ 'stack_size', 'stack_expand', 'loc', 'debug' ]
const RESERVED_KEYS = [ ...SPEC_KEYS, ...HELP_KEYS, ...OTHER_KEYS ]

function prefix_split(pres: string[], attr: Attrs): Attrs[] {
    const attr1: Attrs = { ...attr }
    const pres1 = pres.map(p => `${p}_`)
    const out: Attrs[] = pres.map(_p => ({}))
    Object.keys(attr).map(k => {
        for (const i in pres1) {
            const p1 = pres1[i]
            if (k.startsWith(p1)) {
                const k1 = k.slice(p1.length)
                out[i][k1] = attr1[k]
                delete attr1[k]
                break
            }
        }
    })
    return [ ...out, attr1 ]
}

function prefix_join(pre: string, attr: Attrs): Attrs {
    return Object.fromEntries(
        Object.entries(attr).map(([ k, v ]) => [ `${pre}_${k}`, v ])
    )
}

function spec_split(attr: Attrs, extended: boolean = true): [Attrs, Attrs] {
    const SPLIT_KEYS = extended ? RESERVED_KEYS : SPEC_KEYS
    const spec  = filter_object(attr, (k: string, v: any) => v != null &&  SPLIT_KEYS.includes(k))
    const attr1 = filter_object(attr, (k: string, v: any) => v != null && !SPLIT_KEYS.includes(k))
    return [ spec, attr1 ]
}

//
// element class
//

function is_element(x: any): x is Element {
    return x instanceof Element
}

interface SpecArgs {
    rect?: Rect
    coord?: Rect | 'auto'
    aspect?: number | 'auto'
    expand?: boolean
    align?: Align
    rotate?: number
    invar?: boolean
}

interface ElementArgs extends SpecArgs {
    tag?: string
    unary?: boolean
    children?: any
    pos?: Point
    rad?: number | Point
    xrad?: number
    yrad?: number
    xlim?: Limit
    ylim?: Limit
    xrect?: Limit
    yrect?: Limit
    flex?: boolean
    spin?: number
    hflip?: boolean
    vflip?: boolean
    debug?: boolean
    [key: string]: any
}

// NOTE: if children gets here, it was ignored by the constructor (so dump it)
class Element {
    args: ElementArgs
    tag: string
    unary: boolean
    spec: Spec
    attr: Attrs

    constructor(args: ElementArgs = {}) {
        const { tag, unary, children, pos, rad, xrad, yrad, xlim, ylim, xrect, yrect, flex, spin, hflip, vflip, ...attr0 } = args
        const [ spec, attr ] = spec_split(attr0, false)
        this.args = args

        // core display
        this.tag = tag!
        this.unary = unary!

        // store layout params
        this.spec = spec
        this.attr = attr

        // handle coord and rect convenience
        if (xlim != null || ylim != null) this.spec.coord ??= join_limits({ h: xlim, v: ylim })
        if (xrect != null || yrect != null) this.spec.rect ??= join_limits({ h: xrect, v: yrect })

        // handle pos/rad conveniences
        if (pos != null || rad != null || xrad != null || yrad != null) {
            const has_xy = xrad != null || yrad != null
            const rad1 = has_xy ? [ xrad ?? 0, yrad ?? 0 ] as Point : undefined
            this.spec.rect ??= radial_rect(pos ?? D.pos, rad ?? rad1 ?? D.rad)
            if (has_xy) this.spec.expand = true
        }

        // various convenience conversions
        if (spin != null) { this.spec.rotate = spin; this.spec.invar = true }
        if (hflip === true) this.spec.coord = flip_rect(this.spec.coord, false)
        if (vflip === true) this.spec.coord = flip_rect(this.spec.coord, true)
        if (flex === true) this.spec.aspect = undefined

        // adjust aspect for rotation
        this.spec.aspect0 = this.spec.aspect
        this.spec.aspect = this.spec.invar ? this.spec.aspect0 : rotate_aspect(this.spec.aspect, this.spec.rotate)

        // warn if children are passed
        if (children != null) console.error(`Got children in ${this.tag}`)
    }

    clone(args: Attrs = {}): Element {
        return new (this.constructor as any)({ ...this.args, ...args })
    }

    // why not just compute with ctx.prect=ctx.coord? then it won't get the true aspect right
    // there might be a better way to do this, but this works for now
    rect(ctx: Context): Rect {
        const { prect } = ctx.map(this.spec)
        return remap_rect(prect, ctx.prect, ctx.coord)
    }

    // all this does is pass the
    //
    //
    //
    //  to children (so they also rotate)
    props(ctx: Context): Attrs {
        const { transform } = ctx
        if (transform == null) return this.attr
        return  { ...this.attr, transform }
    }

    inner(_ctx: Context): string {
        return ''
    }

    svg(ctx?: Context): string {
        // default context
        ctx ??= new Context()

        // collect all properties
        const pvals = this.props(ctx)
        const props = props_repr(pvals, ctx.prec)
        const pre = props.length > 0 ? ' ' : ''

        // return final svg
        if (this.unary) {
            return `<${this.tag}${pre}${props} />`
        } else {
            return `<${this.tag}${pre}${props}>${this.inner(ctx)}</${this.tag}>`
        }
    }
}

//
// children geometry
//

function rotated_vertices(rect: Rect, rotate: number | undefined): Point[] {
    // handle zero case first
    if (rotate == null || rotate == 0) {
        const [ x1, y1, x2, y2 ] = rect
        return [ [ x1, y1], [ x2, y2 ] ]
    }

    // get vertices of rect
    const [ cx, cy, rw, rh ] = rect_radial(rect)
    const verts = [
        [-rw, -rh], [ rw, -rh],
        [-rw,  rh], [ rw,  rh],
    ]

    // return rotated vertices
    const theta = d2r * rotate
    const [ SIN, COS ] = [ sin(theta), cos(theta) ]
    return verts.map(([ dx, dy ]) => [
        cx + dx * COS - dy * SIN,
        cy + dx * SIN + dy * COS,
    ])
}

// NOTE: we disable absolute offsets to compute auto aspect
function children_rect(children: Element[], offset: boolean = false): Rect | undefined {
    if (children.length == 0) return

    // get post-rotated vertices of children
    const ctx = new Context()
    const verts = children.flatMap(c => {
        const { prect } = ctx.map({ ...c.spec, offset })
        const rot = c.spec.invar ? 0 : c.spec.rotate
        return rotated_vertices(prect, rot)
    })

    // find enclosing rect for vertices
    return merge_points(verts)
}

function children_aspect(children: Element[]): number | undefined {
    if (children.length == 1) {
        const { aspect } = children[0].spec
        return aspect
    }
}

//
// group class
//

function makeUID(prefix: string): string {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

interface GroupArgs extends ElementArgs {
    clip?: boolean | Element
    mask?: boolean | Element
}

class Group extends Element {
    children: Element[]

    constructor(args: GroupArgs = {}) {
        const { children: children0, aspect: aspect0, coord: coord0, clip: clip0 = false, mask: mask0 = false, debug = false, tag = 'g', ...attr } = args
        const children = ensure_array(children0)

        // handle boolean args
        const clip = clip0 === true ? new Rectangle() : clip0

        // automatic aspect and coord detection
        const aspect = aspect0 == 'auto' ? children_aspect(children) : aspect0
        const coord = coord0 == 'auto' ? children_rect(children) : coord0

        // create debug boxes
        if (debug) {
            const dargs = { stroke_dasharray: 3, opacity: 0.5 }
            const orects = children.map(c => new Rectangle({ rect: c.spec.rect, ...dargs, stroke: blue }))
            const irects = children.map(c => new Rectangle({ ...c.spec, ...dargs, stroke: red }))
            children.push(...irects, ...orects)
        }

        // make actual clip mask
        let clip_path: string | undefined
        if (clip != false) {
            const clip_id = makeUID('clip')
            clip_path = `url(#${clip_id})`
            const mask = new ClipPath({ children: clip, id: clip_id })
            children.push(mask)
        }

        // handle mask
        let mask: string | undefined
        if (mask0 != false) {
            const mask_id = makeUID('mask')
            mask = `url(#${mask_id})`
            const mask_elem = new Mask({ children: mask0, id: mask_id })
            children.push(mask_elem)
        }

        // pass to Element
        super({ tag, unary: false, aspect, coord, clip_path, mask, ...attr })
        this.args = args

        // additional props
        this.children = children
    }

    inner(ctx: Context): string {
        const inner = this.children
            .map(c => c.svg(ctx.map(c.spec)))
            .filter(s => s.length > 0)
            .join('\n')
        return `\n${inner}\n`
    }

    svg(ctx?: Context): string {
        const props = this.props(ctx!)
        if (Object.keys(props).length == 0) return this.inner(ctx!).trim()
        return super.svg(ctx)
    }
}

//
// metadata classes
//

class ClipPath extends Group {
    constructor(args: GroupArgs = {}) {
        const { children: children0, ...attr } = args
        const children = ensure_array(children0)
        super({ tag: 'clipPath', children, ...attr })
        this.args = args
    }

    svg(ctx?: Context): string {
        const def = super.svg(ctx)
        ctx!.meta.addDef(def)
        return ''
    }
}

class Mask extends Group {
    constructor(args: GroupArgs = {}) {
        const { children: children0, ...attr } = args
        const children = ensure_array(children0)
        super({ tag: 'mask', children, ...attr })
        this.args = args
    }

    svg(ctx?: Context): string {
        const def = super.svg(ctx)
        ctx!.meta.addDef(def)
        return ''
    }
}

class Style extends Element {
    text: string

    constructor(args: ElementArgs = {}) {
        const { children: children0 } = args
        const text = check_string(children0)
        super({ tag: 'style', unary: false })
        this.text = text
    }

    svg(_ctx?: Context): string {
        if (this.text.length == 0) return ''
        return `<style>\n${this.text}\n</style>`
    }
}

class Metadata {
    uuid: number
    defs: string[]

    constructor() {
        this.uuid = 0 // next uuid
        this.defs = [] // defs list
    }

    getUid(): string {
        return `uid-${this.uuid++}`
    }

    addDef(def: string): void {
        this.defs.push(def)
    }

    svg(): string {
        if (this.defs.length == 0) return ''
        return `<defs>\n${this.defs.join('\n')}\n</defs>`
    }
}

//
// svg class
//

interface SvgArgs extends GroupArgs {
    size?: number | Point
    padding?: number
    bare?: boolean
    dims?: boolean
    filters?: any
    view?: Rect
    style?: string
    xmlns?: string
    font_family?: string
    font_weight?: number
    prec?: number
}

class Svg extends Group {
    size: Point
    viewrect: Rect
    style: Style
    prec: number

    constructor(args: SvgArgs = {}) {
        const { children: children0, size : size0 = D.size, padding = 1, bare = false, dims = true, filters, aspect: aspect0 = 'auto', view: view0, style, xmlns = svgns, font_family = sans, font_weight = light, prec = D.prec, ...attr } = THEME(args, 'Svg')
        const children = ensure_array(children0)
        const size_base = ensure_point(size0)

        // precompute aspect info
        const aspect = aspect0 == 'auto' ? children_aspect(children) : aspect0
        const [ width, height ] = embed_size(size_base, { aspect })

        // compute outer viewBox
        const viewrect0 = view0 ?? [ 0, 0, width, height ]
        const viewrect = expand_rect(viewrect0, padding) as Rect

        // make style element
        const style_elem = new Style({ children: style ?? '' })
        const dims_attr = dims ? { width, height } : {}

        // pass to Group
        super({ tag: 'svg', children, aspect, xmlns, font_family, font_weight, ...dims_attr, ...attr })
        this.args = args

        // additional props
        this.size = [ width, height ]
        this.viewrect = viewrect
        this.style = style_elem
        this.prec = prec
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { viewrect } = this
        const { prec } = ctx

        // construct viewBox
        const [ x, y, w, h ] = rect_box(viewrect)
        const viewBox = `${rounder(x, prec)} ${rounder(y, prec)} ${rounder(w, prec)} ${rounder(h, prec)}`

        // return attributes
        return { viewBox, ...attr }
    }

    inner(ctx: Context): string {
        const inner = super.inner(ctx)
        const defs = ctx.meta.svg()
        const style = this.style.svg(ctx)
        const body = [ defs, style, inner ]
            .filter(s => s.length > 0)
            .map(s => s.trim())
            .join('\n')
        return `\n${body}\n`
    }

    svg(args?: ContextArgs): string {
        const { size, prec } = this

        // make new context
        const [ w, h ] = size
        const prect = [ 0, 0, w, h ] as Rect
        const ctx = new Context({ prect, prec, ...args })

        // render children
        return super.svg(ctx)
    }
}

//
// rectangle class
//

interface RectArgs extends ElementArgs {
    rounded?: number | Point
}

class Rectangle extends Element {
    rounded?: number | Point

    constructor(args: RectArgs = {}) {
        let { rounded, ...attr } = THEME(args, 'Rect')

        // pass to Element
        super({ tag: 'rect', unary: true, ...attr })
        this.args = args

        // additional props
        this.rounded = rounded
    }

    props(ctx: Context): Attrs {
        // get core attributes
        const attr = super.props(ctx)

        // get true pixel rect
        const { prect } = ctx
        let [ x, y, w, h ] = rect_box(prect, true)

        // scale border rounded
        let rx: number | undefined
        let ry: number | undefined
        if (this.rounded != null) {
            let s = 0.5 * (w + h)
            if (is_scalar(this.rounded)) {
                rx = s * this.rounded
            } else {
                [ rx, ry ] = mul(this.rounded, s)
            }
        }

        // output properties
        return { x, y, width: w, height: h, rx, ry, ...attr }
    }
}

//
// exports
//

export { Context, Element, Group, Svg, Rectangle, is_element, prefix_split, prefix_join, spec_split, align_frac }
export type { SpecArgs, ElementArgs, GroupArgs, ContextArgs, SvgArgs, RectArgs }
