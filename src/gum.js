// gum.js

import { CONSTANTS as C, DEFAULTS as D, DEBUG, THEME, setTheme } from './defaults.js'
import { is_scalar, is_string, is_object, is_function, is_array, ensure_array, ensure_vector, ensure_singleton, ensure_function, gzip, zip, reshape, split, concat, intersperse, sum, prod, mean, add, sub, mul, div, cumsum, norm, normalize, range, linspace, enumerate, repeat, padvec, meshgrid, lingrid, filter_object, compress_whitespace, exp, log, sin, cos, tan, cot, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, minimum, maximum, heavisign, abs_min, abs_max, min, max, clamp, rescale, sigmoid, logit, smoothstep, identity, invert, random, uniform, normal } from './utils.js'
import { textSizer, splitWords, wrapWidths, wrapText } from './text.js'
import { parseMarkdown } from './mark.js'
import { mathjax } from './math.js'

//
// element tests
//

function is_element(x) {
    return x instanceof Element
}

//
// type checks
//

function check_singleton(children) {
    if (children == null || children.length == 0) return null
    if (is_array(children) && children.length > 1) {
        throw new Error('Must have exactly one child')
    }
    return ensure_singleton(children)
}

function check_string(children) {
    const child = check_singleton(children)
    if (child == null) return ''
    if (!is_string(child)) {
        throw new Error('Child must be a string')
    }
    return child
}

//
// core math
//

// to be used in functions
class NamedNumber extends Number {
    constructor(name, value) {
        super(value)
        this.name = name
    }
}

class NamedString extends String {
    constructor(name, value) {
        super(value)
        this.name = name
    }
}

// constants
const e = new NamedNumber('e', Math.E)
const pi = new NamedNumber('pi', Math.PI)
const phi = new NamedNumber('phi', (1 + sqrt(5)) / 2)
const r2d = new NamedNumber('r2d', 180 / Math.PI)
const d2r = new NamedNumber('d2r', Math.PI / 180)
const none = new NamedString('none', 'none')
const white = new NamedString('white', '#ffffff')
const black = new NamedString('black', '#000000')
const blue = new NamedString('blue', '#1e88e5')
const red = new NamedString('red', '#ff0d57')
const green = new NamedString('green', '#4caf50')
const yellow = new NamedString('yellow', '#ffb300')
const purple = new NamedString('purple', '#9c27b0')
const gray = new NamedString('gray', '#f0f0f0')
const lightgray = new NamedString('lightgray', '#f6f6f6')
const darkgray = new NamedString('darkgray', '#888888')

// font names
const sans = new NamedString('sans', C.sans)
const mono = new NamedString('mono', C.mono)
const moji = new NamedString('moji', C.moji)
const bold = new NamedNumber('bold', C.bold)

//
// metaposition arithmetic
//

function ensure_mpos(p) {
    return is_scalar(p) ? [ p, 0 ] : p
}

function add_mpos(p0, p1) {
    const [ x0, c0 ] = ensure_mpos(p0)
    const [ x1, c1 ] = ensure_mpos(p1)
    const [ x, c ] = [ x0 + x1, c0 + c1 ]
    return c == 0 ? x : [ x, c ]
}

function sub_mpos(p0, p1) {
    const [ x0, c0 ] = ensure_mpos(p0)
    const [ x1, c1 ] = ensure_mpos(p1)
    const [ x, c ] = [ x0 - x1, c0 - c1 ]
    return c == 0 ? x : [ x, c ]
}

//
// rect stats
//

function rect_size(rect) {
    const [ x1, y1, x2, y2 ] = rect
    return [ x2 - x1, y2 - y1 ]
}

function rect_dims(rect) {
    const [ w, h ] = rect_size(rect)
    return [ abs(w), abs(h) ]
}

function rect_center(rect) {
    const [ x1, y1, x2, y2 ] = rect
    return [ (x1 + x2) / 2, (y1 + y2) / 2 ]
}

function rect_radius(rect) {
    const [ w, h ] = rect_size(rect)
    return [ w / 2, h / 2 ]
}

function rect_aspect(rect) {
    if (rect == null) return null
    const [ w, h ] = rect_dims(rect)
    return w / h
}

//
// rect formats
//

// radial rect: center, radius
function rect_radial(rect, absolute = false) {
    const [ cx, cy ] = rect_center(rect)
    const [ rx0, ry0 ] = rect_radius(rect)
    const [ rx, ry ] = absolute ? [ abs(rx0), abs(ry0) ] : [ rx0, ry0 ]
    return [ cx, cy, rx, ry ]
}

function radial_rect(p, r) {
    const [ x, y ] = p
    const [ rx, ry ] = ensure_vector(r, 2)
    return [
        sub_mpos(x, rx), sub_mpos(y, ry),
        add_mpos(x, rx), add_mpos(y, ry),
    ]
}

// box rect: min, size
function rect_box(rect, absolute = false) {
    const [ x1, y1, x2, y2 ] = rect
    const [ w, h ] = [ x2 - x1, y2 - y1 ]
    if (absolute) {
        return [ minimum(x1, x2), minimum(y1, y2), abs(w), abs(h) ]
    } else {
        return [ x1, y1, w, h ]
    }
}

function box_rect(box) {
    const [ x, y, w, h ] = box
    return [ x, y, x + w, y + h ]
}

// center box rect: center, size
function rect_cbox(rect) {
    const [ cx, cy ] = rect_center(rect)
    const [ w, h ] = rect_size(rect)
    return [ cx, cy, w, h ]
}

function cbox_rect(cbox) {
    const [ cx, cy, w, h ] = cbox
    const [ rx, ry ] = [ w / 2, h / 2 ]
    return [ cx - rx, cy - ry, cx + rx, cy + ry ]
}

//
// rect aggregators
//

function merge_rects(rects) {
    if (rects == null || rects.length == 0) return null
    const rects1 = rects.filter(r => r != null)
    if (rects1.length == 0) return null
    const [ xa, ya, xb, yb ] = zip(...rects1)
    const [ xs, ys ] = [ [ ...xa, ...xb ], [ ...ya, ...yb ] ]
    return [ min(xs), min(ys), max(xs), max(ys) ]
}

function merge_points(points) {
    if (points == null || points.length == 0) return null
    const [ xs, ys ] = zip(...points)
    return [ min(xs), min(ys), max(xs), max(ys) ]
}

function merge_values(vals) {
    if (vals == null || vals.length == 0) return null
    return [ min(vals), max(vals) ]
}

//
// rect transformers
//

function expand_limits(lim, fact) {
    if (lim == null) return null
    const [ lo, hi ] = lim
    const ex = fact * (hi - lo)
    return [ lo - ex, hi + ex ]
}

function expand_rect(rect, expand) {
    if (rect == null) return null
    const [ xexp, yexp ] = ensure_vector(expand, 2)
    const [ x1, y1, x2, y2 ] = rect
    return [ x1 - xexp, y1 - yexp, x2 + xexp, y2 + yexp ]
}

function flip_rect(rect, vertical) {
    const [ x1, y1, x2, y2 ] = rect ?? D.rect
    if (vertical) return [ x1, y2, x2, y1 ]
    else return [ x2, y1, x1, y2 ]
}

function upright_rect(rect) {
    if (rect == null) return null
    const [ x1, y1, x2, y2 ] = rect
    return [
        minimum(x1, x2), minimum(y1, y2),
        maximum(x1, x2), maximum(y1, y2),
    ]
}

//
// limit utils
//

function join_limits({ v, h } = {}) {
    const [ vlo, vhi ] = v ?? D.lim
    const [ hlo, hhi ] = h ?? D.lim
    return [ hlo, vlo, hhi, vhi ]
}

function split_limits(coord) {
    if (coord == null) return {}
    const [ xlo, ylo, xhi, yhi ] = coord
    return { xlim: [ xlo, xhi ], ylim: [ ylo, yhi ] }
}

function resolve_limits(xlim, ylim, coord) {
    const { xlim: xlim0, ylim: ylim0 } = split_limits(coord)
    return { xlim: xlim ?? xlim0, ylim: ylim ?? ylim0 }
}

function detect_coords(xvals, yvals, xlim, ylim) {
    return join_limits({
        h: xlim ?? merge_values(xvals),
        v: ylim ?? merge_values(yvals),
    })
}

function invert_direc(direc) {
    return direc == 'v' ? 'h' :
           direc == 'h' ? 'v' :
           direc
}

//
// aspect utils
//

function aspect_invariant(value, aspect, alpha = 0.5) {
    aspect = aspect ?? 1

    const wfact = aspect**alpha
    const hfact = aspect**(1 - alpha)

    if (is_scalar(value)) {
        value = [ value, value ]
    }

    if (value.length == 2) {
        const [ vw, vh ] = value
        return [ vw * wfact, vh / hfact ]
    } else if (value.length == 4) {
        const [ vl, vt, vr, vb ] = value
        return [ vl * wfact, vt / hfact, vr * wfact, vb / hfact ]
    }
}

//
// angle and direction utils
//

function norm_angle(deg) {
    if (deg == 360) return 359.99
    deg = deg % 360
    return deg < 0 ? deg + 360 : deg
}

function vector_angle(vector) {
    const [ x, y ] = vector
    return r2d * Math.atan2(y, x)
}

function cardinal_direc(direc) {
    return (direc == 'n') ? [ 0, -1] :
           (direc == 'e') ? [ 1, 0 ] :
           (direc == 'w') ? [-1, 0 ] :
           (direc == 's') ? [ 0, 1 ] :
           null
}

function unit_direc(direc) {
    if (direc == null) return null
    if (is_string(direc)) return cardinal_direc(direc)
    if (is_scalar(direc)) return [ cos(d2r * direc), sin(d2r * direc) ]
    if (is_array(direc) && direc.length == 2) return normalize(direc, 2)
    throw new Error(`Invalid direction: ${direc}`)
}

//
// attributes
//

// reserved keys
const SPEC_KEYS = [ 'rect', 'aspect', 'expand', 'align', 'rotate', 'invar', 'coord' ]
const HELP_KEYS = [ 'pos', 'rad', 'xlim', 'ylim', 'flex', 'spin', 'hflip', 'vflip', 'xrad', 'yrad' ]
const OTHER_KEYS = [ 'stack_size', 'stack_expand', 'loc', 'debug' ]
const RESERVED_KEYS = [ ...SPEC_KEYS, ...HELP_KEYS, ...OTHER_KEYS ]

function prefix_split(pres, attr) {
    const attr1 = { ...attr }
    const pres1 = pres.map(p => `${p}_`)
    const out = pres.map(p => ({}))
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

function prefix_join(pre, attr) {
    return Object.fromEntries(
        Object.entries(attr).map(([ k, v ]) => [ `${pre}_${k}`, v ])
    )
}

function spec_split(attr, extended = true) {
    const SPLIT_KEYS = extended ? RESERVED_KEYS : SPEC_KEYS
    const spec  = filter_object(attr, (k, v) => v != null &&  SPLIT_KEYS.includes(k))
    const attr1 = filter_object(attr, (k, v) => v != null && !SPLIT_KEYS.includes(k))
    return [ spec, attr1 ]
}

//
// string formatters
//

function demangle(k) {
    return k.replace('_', '-')
}

function rounder(x, prec) {
    prec = prec ?? D.prec

    let suf
    if (is_string(x) && x.endsWith('px')) {
        x = Number(x.slice(0, -2))
        suf = 'px'
    } else {
        suf = ''
    }

    let ret
    if (is_scalar(x)) {
        ret = x.toFixed(prec)
        ret = ret.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '')
    } else {
        ret = x
    }

    return ret + suf
}

function props_repr(d, prec) {
    return Object.entries(d)
        .filter(([k, v]) => v != null)
        .map(([k, v]) => `${demangle(k)}="${rounder(v, prec)}"`)
        .join(' ')
}

//
// color handling
//

function hexToRgba(hex) {
    hex = hex.replace('#', '')
    if (hex.length == 3) {
        hex = hex.split('').map(c => c + c).join('')
    } else if (hex.length == 4) {
        hex = hex.split('').map(c => c + c).join('')
    }
    const r = parseInt(hex.slice(0, 2), 16)
    const g = parseInt(hex.slice(2, 4), 16)
    const b = parseInt(hex.slice(4, 6), 16)
    const a = hex.length == 8 ? parseInt(hex.slice(6, 8), 16) : 255
    return [ r, g, b, a / 255 ]
}

function interp(start0, stop0, x) {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const slope = sub(stop, start)
    const [ r, g, b, a ] = add(start, mul(slope, x))
    return `rgba(${r}, ${g}, ${b}, ${a})`
}

function palette(start0, stop0, clim = D.lim) {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const slope = sub(stop, start)
    const scale = rescaler(clim, D.lim)
    function gradient(x) {
        const x1 = scale(x)
        const [ r, g, b, a ] = add(start, mul(slope, x1))
        return `rgba(${r}, ${g}, ${b}, ${a})`
    }
    return gradient
}

//
// context mapping
//

function align_frac(align) {
    if (is_scalar(align)) {
        return align
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
function embed_size(size, { aspect = null, expand = false } = {}) {
    if (aspect == null) return size
    const [ w0, h0 ] = size
    const [ aw, ah ] = [ abs(w0), abs(h0) ]
    const [ sw, sh ] = [ heavisign(w0), heavisign(h0) ]
    const agg = expand ? maximum : minimum
    const h = agg(aw / aspect, ah)
    const w = h * aspect
    return [ sw * w, sh * h ]
}

// get the size of an `aspect` rect that will fit in `size` after `rotate`
function rotate_rect(size, rotate, { aspect = null, expand = false, invar = false, tol = 0.001 } = {}) {
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
    return [ w, h ]
}

// get the aspect of a rect of given `aspect` after rotating it by `rotate` degrees
function rotate_aspect(aspect, rotate) {
    if (aspect == null || rotate == null) return aspect
    const theta = d2r * rotate
    const SIN = abs(sin(theta))
    const COS = abs(cos(theta))
    const DW = aspect * COS + SIN
    const DH = aspect * SIN + COS
    return DW / DH
}

function remap_rect(rect, coord_in, coord_out) {
    const [ x0, y0, x1, y1 ] = rect
    const [ c0x0, c0y0, c0x1, c0y1 ] = coord_in
    const [ c1x0, c1y0, c1x1, c1y1 ] = coord_out
    const [ cw0, ch0 ] = [ c0x1 - c0x0, c0y1 - c0y0 ]
    const [ cw1, ch1 ] = [ c1x1 - c1x0, c1y1 - c1y0 ]
    const [ fx0, fy0, fx1, fy1 ] = [
        (x0 - c0x0) / cw0, (y0 - c0y0) / ch0,
        (x1 - c0x0) / cw0, (y1 - c0y0) / ch0,
    ]
    return [
        c1x0 + cw1 * fx0, c1y0 + ch1 * fy0,
        c1x0 + cw1 * fx1, c1y0 + ch1 * fy1,
    ]
}

function rescaler(lim_in, lim_out) {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    return (x0, offset = true) => {
        const [ x, c ] = is_array(x0) ? x0 : [ x0, 0 ]
        const f = (x - in_lo) / in_len
        const x1 = out_lo + f * out_len
        return offset ? x1 + c : x1
    }
}

function resizer(lim_in, lim_out) {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    const ratio = out_len / in_len
    return (x0, offset = true) => {
        const [ x, c ] = is_array(x0) ? x0 : [ x0, 0 ]
        const x1 = x * ratio
        return offset ? x1 + c : x1
    }
}

// context holds the current pixel rect and other global settings
// map() will create a new sub-context using rect in coord space
// map*() functions map from coord to pixel space (in prect)
class Context {
    constructor(args = {}) {
        const { prect = D.rect, coord = D.coord, transform = null, prec = D.prec, meta = null } = args
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
        this.init_scalers()
    }

    clone(args) {
        return new Context({ ...this.args, meta: this.meta, ...args })
    }

    // there are heavily used, so precompute what we can (haven't profiled yet)
    init_scalers() {
        const [ cx1, cy1, cx2, cy2 ] = this.coord
        const [ px1, py1, px2, py2 ] = this.prect
        this.rescalex = rescaler([ cx1, cx2 ], [ px1, px2 ])
        this.rescaley = rescaler([ cy1, cy2 ], [ py1, py2 ])
        this.resizex = resizer([ cx1, cx2 ], [ px1, px2 ])
        this.resizey = resizer([ cy1, cy2 ], [ py1, py2 ])
    }

    // map point from coord to pixel
    mapPoint(cpoint, offset = true) {
        const [ cx, cy ] = cpoint
        return [ this.rescalex(cx, offset), this.rescaley(cy, offset) ]
    }

    // map rect from coord to pixel
    mapRect(crect, offset = true) {
        const [ x1, y1, x2, y2 ] = crect
        return [
            this.rescalex(x1, offset), this.rescaley(y1, offset),
            this.rescalex(x2, offset), this.rescaley(y2, offset),
        ]
    }

    // map size from coord to pixel
    mapSize(csize, offset = true) {
        const [ sw, sh ] = csize
        return [ this.resizex(sw, offset), this.resizey(sh, offset) ]
    }

    // NOTE: this is the main mapping function! be very careful when changing it!
    map({ rect, aspect0: aspect = null, expand = false, align = 'center', rotate = 0, invar = false, offset = true, coord = D.coord } = {}) {
        // use parent coord as default rect
        rect ??= this.coord

        // get true pixel rect
        const prect0 = this.mapRect(rect, offset)
        const [ x0, y0, w0, h0 ] = rect_cbox(prect0)

        // rotate rect inside
        const [ w, h ] = rotate_rect([ w0, h0 ], rotate, { aspect, expand, invar })
        const transform = (rotate != null && rotate != 0) ? `rotate(${rotate}, ${x0}, ${y0})` : null

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
// element class
//

// NOTE: if children gets here, it was ignored by the constructor (so dump it)
class Element {
    constructor(args = {}) {
        const { tag, unary, children, pos, rad, xrad, yrad, xlim, ylim, xrect, yrect, flex, spin, hflip, vflip, ...attr0 } = args
        const [ spec, attr ] = spec_split(attr0, false)
        this.args = args

        // core display
        this.tag = tag
        this.unary = unary

        // store layout params
        this.spec = spec
        this.attr = attr

        // handle coord and rect convenience
        if (xlim != null || ylim != null) this.spec.coord ??= join_limits({ h: xlim, v: ylim })
        if (xrect != null || yrect != null) this.spec.rect ??= join_limits({ h: xrect, v: yrect })

        // handle pos/rad conveniences
        if (pos != null || rad != null || xrad != null || yrad != null) {
            const has_xy = xrad != null || yrad != null
            const rad1 = has_xy ? [ xrad ?? null, yrad ?? null ] : null
            this.spec.rect ??= radial_rect(pos ?? D.pos, rad ?? rad1 ?? D.rad)
            if (has_xy) this.spec.expand = true
        }

        // various convenience conversions
        if (spin != null) { this.spec.rotate = spin; this.spec.invar = true }
        if (hflip === true) this.spec.coord = flip_rect(this.spec.coord, false)
        if (vflip === true) this.spec.coord = flip_rect(this.spec.coord, true)
        if (flex === true) this.spec.aspect = null

        // adjust aspect for rotation
        if (this.spec.aspect === true) this.spec.aspect = 1
        this.spec.aspect0 = this.spec.aspect
        this.spec.aspect = this.spec.invar ? this.spec.aspect0 : rotate_aspect(this.spec.aspect, this.spec.rotate)

        // warn if children are passed
        if (children != null) console.error(`Got children in ${this.tag}`)
    }

    clone(args) {
        return new this.constructor({ ...this.args, ...args })
    }

    // why not just compute with ctx.prect=ctx.coord? then it won't get the true aspect right
    // there might be a better way to do this, but this works for now
    rect(ctx) {
        const { prect } = ctx.map(this.spec)
        return remap_rect(prect, ctx.prect, ctx.coord)
    }

    // all this does is pass the transform to children (so they also rotate)
    props(ctx) {
        const { transform } = ctx
        if (transform == null) return this.attr
        return  { ...this.attr, transform }
    }

    inner(ctx) {
        return ''
    }

    svg(ctx) {
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
// debug class
//

function debug_element(element, indent = 0) {
    // indent with spaces
    const spaces = ' '.repeat(indent)

    // print name and arguments
    const args = Object.entries(element.args)
      .filter(([ k, v ]) => k != 'children' && v != null)
      .map(([ k, v ]) => `${k}=${JSON.stringify(v)}`)
    console.error(`${spaces}${element.constructor.name.toUpperCase()}(${args.join(', ')})`)

    // special cases
    if (element instanceof TextSpan) {
        console.error(`${spaces}  STRING(${element.text})`)
    } else if (element instanceof Group) {
        element.children.forEach(c => debug_element(c, indent + 2))
    }
}

class Debug {
    constructor(args = {}) {
        const { children: children0, ...attr } = THEME(args, 'Debug')
        this.children = ensure_array(children0)
        this.attr = attr
    }

    svg(ctx) {
        console.error('======== DEBUG START ========')
        debug_element(this)
        console.error('======== DEBUG END ========')
        return ''
    }
}

//
// group class
//

function rotated_vertices(rect, rotate) {
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
function children_rect(children, offset = false) {
    if (children.length == 0) return null

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

function makeUID(prefix) {
    return `${prefix}-${Math.random().toString(36).slice(2, 10)}`
}

class Group extends Element {
    constructor(args = {}) {
        const { children: children0, aspect: aspect0, coord: coord0, clip: clip0 = false, mask: mask0 = false, debug = false, tag = 'g', ...attr } = args
        const children = ensure_array(children0)

        // handle boolean args
        const clip = clip0 === true ? new Rect() : clip0

        // automatic aspect and coord detection
        const aspect = aspect0 == 'auto' ? rect_aspect(children_rect(children)) : aspect0
        const coord = coord0 == 'auto' ? children_rect(children) : coord0

        // create debug boxes
        if (debug) {
            const orects = children.map(c => new Rect({ rect: c.spec.rect, ...DEBUG, stroke: blue }))
            const irects = children.map(c => new Rect({ ...c.spec, ...DEBUG, stroke: red }))
            children.push(...irects, ...orects)
        }

        // make actual clip mask
        let clip_path = null
        if (clip != false) {
            const clip_id = makeUID('clip')
            clip_path = `url(#${clip_id})`
            const mask = new ClipPath({ children: clip, id: clip_id })
            children.push(mask)
        }

        // handle mask
        let mask = null
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

    inner(ctx) {
        const inner = this.children
            .map(c => c.svg(ctx.map(c.spec)))
            .filter(s => s.length > 0)
            .join('\n')
        return `\n${inner}\n`
    }

    svg(ctx) {
        const props = this.props(ctx)
        if (Object.keys(props).length == 0) return this.inner(ctx).trim()
        return super.svg(ctx)
    }
}

//
// metadata classes
//

class ClipPath extends Group {
    constructor(args = {}) {
        const { children: children0, ...attr } = args
        const children = ensure_array(children0)
        super({ tag: 'clipPath', children, ...attr })
        this.args = args
    }

    svg(ctx) {
        const def = super.svg(ctx)
        ctx.meta.addDef(def)
        return ''
    }
}

class Mask extends Group {
    constructor(args = {}) {
        const { children: children0, ...attr } = args
        const children = ensure_array(children0)
        super({ tag: 'mask', children, ...attr })
        this.args = args
    }

    svg(ctx) {
        const def = super.svg(ctx)
        ctx.meta.addDef(def)
        return ''
    }
}

class Style extends Element {
    constructor(args = {}) {
        const { children: children0 } = args
        const text = check_string(children0)
        super({ tag: 'style', unary: false })
        this.text = text
    }

    svg(ctx) {
        if (this.text.length == 0) return ''
        return `<style>\n${this.text}\n</style>`
    }
}

class Metadata {
    constructor() {
        this.uuid = 0 // next uuid
        this.defs = [] // defs list
    }

    getUid() {
        return `uid-${this.uuid++}`
    }

    addDef(def) {
        this.defs.push(def)
    }

    svg() {
        if (this.defs.length == 0) return ''
        return `<defs>\n${this.defs.join('\n')}\n</defs>`
    }
}

//
// svg class
//

class Svg extends Group {
    constructor(args = {}) {
        const { children: children0, size : size0, padding = 1, bare = false, dims = true, filters = null, aspect: aspect0 = 'auto', view: view0, style = null, xmlns = C.svgns, font_family = C.sans, font_weight = C.normal, size = D.size, prec = D.prec, ...attr } = THEME(args, 'Svg')
        const children = ensure_array(children0)
        const size_base = ensure_vector(size0, 2)

        // precompute aspect info
        const aspect = aspect0 == 'auto' ? rect_aspect(children_rect(children)) : aspect0
        const [ width, height ] = embed_size(size_base, { aspect })

        // compute outer viewBox
        const viewrect0 = view0 ?? [ 0, 0, width, height ]
        const viewrect = expand_rect(viewrect0, padding)

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

    props(ctx) {
        const attr = super.props(ctx)
        const { viewrect } = this
        const { prec } = ctx

        // construct viewBox
        const [ x, y, w, h ] = rect_box(viewrect)
        const viewBox = `${rounder(x, prec)} ${rounder(y, prec)} ${rounder(w, prec)} ${rounder(h, prec)}`

        // return attributes
        return { viewBox, ...attr }
    }

    inner(ctx) {
        const inner = super.inner(ctx)
        const defs = ctx.meta.svg()
        const style = this.style.svg(ctx)
        const body = [ defs, style, inner ]
            .filter(s => s.length > 0)
            .map(s => s.trim())
            .join('\n')
        return `\n${body}\n`
    }

    svg(args) {
        const { size, prec } = this

        // make new context
        const [ w, h ] = size
        const prect = [ 0, 0, w, h ]
        const ctx = new Context({ prect, prec, ...args })

        // render children
        return super.svg(ctx)
    }
}

//
// layout classes
//

function maybe_rounded_rect(rounded) {
    if (rounded == null) {
        return new Rect()
    } else {
        return new RoundedRect({ rounded })
    }
}

function pad_rect(p) {
    if (p == null) {
        return [ 0, 0, 0, 0 ]
    } else if (is_scalar(p)) {
        return [ p, p, p, p ]
    } else if (p.length == 2) {
        const [ px, py ] = p
        return [ px, py, px, py ]
    } else {
        return p
    }
}

// map padding/margin into internal boxes
function apply_padding(padding, aspect0) {
    const [ pl, pt, pr, pb ] = padding
    const [ pw, ph ] = [ pl + 1 + pr, pt + 1 + pb ]
    const rect = [ pl / pw, pt / ph, 1 - pr / pw, 1 - pb / ph ]
    const aspect = (aspect0 != null) ? aspect0 * (pw / ph) : null
    return { rect, aspect }
}

function computeBoxLayout(children, { padding = null, margin = null, aspect = null, adjust = true } = {}) {
    // try to determine box aspect
    const aspect_child = aspect ?? children[0]?.spec?.aspect

    // handle all null case
    if (padding == null && margin == null) {
        return {
            rect_inner: D.rect, rect_outer: D.rect,
            aspect_inner: aspect_child, aspect_outer: aspect_child
        }
    }

    // apply padding to outer rect
    padding = pad_rect(padding)
    if (adjust && aspect_child != null) padding = aspect_invariant(padding, 1 / aspect_child)
    const { rect: rect_inner, aspect: aspect_inner } = apply_padding(padding, aspect_child)

    // apply margin to global rect
    margin = pad_rect(margin)
    if (adjust && aspect_inner != null) margin = aspect_invariant(margin, 1 / aspect_inner)
    const { rect: rect_outer, aspect: aspect_outer } = apply_padding(margin, aspect_inner)

    // apply padding/margin and get box sizes
    aspect ??= aspect_outer

    // return inner/outer rects and aspect
    return { rect_inner, rect_outer, aspect_inner, aspect_outer }
}

class Box extends Group {
    constructor(args = {}) {
        let { children: children0, padding, margin, border, fill, shape, rounded, aspect, clip = false, adjust = true, debug = false, ...attr0 } = THEME(args, 'Box')
        const children = ensure_array(children0)
        const [ border_attr, fill_attr, attr] = prefix_split([ 'border', 'fill' ], attr0)

        // ensure shape is a function
        shape ??= maybe_rounded_rect(rounded)

        // compute layout
        const { rect_inner, rect_outer, aspect_outer } = computeBoxLayout(children, { padding, margin, border, aspect, adjust })

        // make framing elements
        const rect_cl = clip ? shape : false
        const rect_bg = fill != null ? shape.clone({ fill, stroke: none, ...fill_attr }) : null
        const rect_fg = border != null ? shape.clone({ stroke_width: border, ...border_attr }) : null

        // make inner groups
        const inner = new Group({ children, rect: rect_inner, debug })
        const outer = new Group({ children: [ rect_bg, inner, rect_fg ], rect: rect_outer, clip: rect_cl })

        // pass to Group
        super({ children: outer, aspect: aspect_outer, ...attr })
        this.args = args
    }
}

class Frame extends Box {
    constructor(args = {}) {
        const { border = 1, ...attr } = THEME(args, 'Frame')
        super({ border, ...attr })
        this.args = args
    }
}

// TODO: better justify handling with aspect override (right now it's sort of "left" justified)
function computeStackLayout(direc, children, { spacing = 0, even = false, aspect: aspect0 = null }) {
    // short circuit if empty
    if (children.length == 0) return { ranges: null, aspect: null}

    // get size and aspect data from children
    // adjust for direction (invert aspect if horizontal)
    const items = children.map(c => {
        const size = c.attr.stack_size ?? (even ? 1 / children.length : null)
        const expd = c.attr.stack_expand ?? true
        const aspect = expd ? c.spec.aspect : null
        return { size, aspect }
    })

    // handle horizontal case (invert aspect)
    if (direc == 'v') {
        for (const c of items) c.aspect = invert(c.aspect)
    }

    // compute total share of non-spacing elements
    const F_total = 1 - spacing * (children.length - 1)

    // for computing return values
    const getSizes = cs => cs.map(c => c.size ?? 0)
    const getAspect0 = (direc == 'v') ? invert : identity
    const getAspect = a => (aspect0 ?? getAspect0(a))

    // compute ranges with spacing
    function getRanges(sizes0) {
        const sizes1 = sizes0.map(s0 => F_total * s0)
        const bases = cumsum(sizes1.map(s1 => s1 + spacing)).slice(0, -1)
        return zip(bases, sizes1).map(([b, s1]) => [b, b + s1])
    }

    // children = list of dicts with keys size (s_i) and aspect (a_i)
    // const fixed = children.filter(c => c.size != null && c.aspect == null)
    const over = items.filter(c => c.size != null && c.aspect != null)
    const expo = items.filter(c => c.size == null && c.aspect != null)
    const flex = items.filter(c => c.size == null && c.aspect == null)

    // get target aspect from over-constrained children
    // this is generically imperfect if len(over) > 1
    // single element case (exact): s * F_total * L = a
    // multi element case (approximate): agg(s_i / a_i) * F_total * L = 1
    const agg = x => max(x) // fit to max aspect, otherwise will underfit
    const L_over = (over.length > 0) ? 1 / (F_total * agg(over.map(c => c.size / c.aspect))) : null

    // knock out (over/exactly)-budgeted case right away
    // short-circuit since this is relatively simple
    const S_sum = sum(getSizes(items))
    if (S_sum >= 1 || (expo.length == 0 && flex.length == 0)) {
        const sizes = getSizes(items)
        const ranges = getRanges(sizes)
        const aspect = getAspect(L_over)
        return { ranges, aspect }
    }

    // set length to maximally accommodate over-constrained children (or expandables)
    // add up lengths required to make expandables height 1 (w = a)
    // set length to satisfy: L_expand * (1 - S_sum) * F_total = sum(w) = sum(a)
    const L_expand = (expo.length > 0) ? sum(expo.map(c => c.aspect)) / ((1 - S_sum) * F_total) : null
    const L_target = aspect0 ?? ((over.length > 0) ? L_over : L_expand)

    // allocate space to expand then flex children
    // S_exp0 gets full length of expandables given realized L_target
    // S_exp is the same but constrained so the sums are less than 1
    // should satisfy: s * F_total * L_target = a
    const S_exp0 = sum(expo.map(c => c.aspect / (F_total * L_target)))
    const S_exp = minimum(S_exp0, 1 - S_sum)
    const scale = S_exp / S_exp0 // this is 1 in the unconstrained case
    for (const c of expo) c.size = c.aspect / (F_total * L_target) * scale

    // distribute remaining space to flex children, if any
    // S_left is the remaining space after pre-allocated and expandables (may hit 0)
    const S_left = 1 - S_sum - S_exp
    if (flex.length > 0) {
        for (const c of flex) c.size = S_left / flex.length
    }

    // compute heights and aspect
    const sizes = getSizes(items)
    const ranges = getRanges(sizes)
    const aspect = getAspect(L_target)
    return { ranges, aspect }
}

// expects list of Element or [Element, height]
// this is written as vertical, horizonal swaps dimensions and inverts aspects
// TODO: make native way to mimic using Spacer elements for spacing
class Stack extends Group {
    constructor(args = {}) {
        let { children, direc, spacing = 0, justify = 'center', aspect: aspect0, even = false, ...attr } = THEME(args, 'Stack')
        children = ensure_array(children)

        // compute layout
        const spacing1 = spacing / maximum(children.length - 1, 1)
        const { ranges, aspect } = computeStackLayout(direc, children, { spacing: spacing1, even, aspect: aspect0 })

        // assign child rects
        children = children.length > 0 ? zip(children, ranges).map(([c, b]) => {
            const rect = join_limits({ [direc]: b })
            const align = c.spec.align ?? justify
            return c.clone({ rect, align })
        }) : []

        // pass to Group
        super({ children, aspect, ...attr })
        this.args = args
    }
}

class VStack extends Stack {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VStack')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HStack extends Stack {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HStack')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

function default_measure(c) {
    return c.spec.aspect ?? 1
}

// like stack but wraps elements to multiple lines/columns
class HWrap extends VStack {
    constructor(args = {}) {
        const { children: children0, spacing = 0, padding = 0, wrap = null, justify = 'left', measure: measure0 = null, debug, ...attr } = THEME(args, 'HWrap')
        const children = ensure_array(children0)
        const measure = measure0 ?? default_measure

        // make HStack rows
        const { rows } = wrapWidths(children, measure, wrap)
        const lines = rows.map(row => new HStack({ children: row, spacing: padding, align: justify, debug }))
        const boxes = lines.map(line => new Group({ children: line, aspect: wrap ?? line.spec.aspect }))

        // pass to VStack
        super({ children: boxes, spacing, even: true, debug, ...attr })
        this.args = args
    }
}

/* grid layout and aspect computation (grok)
\log(\mu) = \frac{1}{M N} \sum_{i=1}^M \sum_{j=1}^N \log a_{ij}
\log(u)_j = \frac{1}{M} \sum_{i=1}^M \log a_{ij} - \log(\mu)
\log(v)_i = \log(\mu) - \frac{1}{N} \sum_{j=1}^N \log a_{ij}
w_j = \frac{u_j}{\sum_{k=1}^N u_k}
h_i = \frac{v_i}{\sum_{k=1}^M v_k}
\log(a) = \log(\mu) - \frac{1}{N} \sum_{j=1}^N \log(w_j) + \frac{1}{M} \sum_{i=1}^M \log(h_i)
*/

function computeGridLayout(children, rows, cols, { widths, heights, spacing } = {}) {
    // aggregate aspect ratios along rows and columns (assuming null goes to 1)
    const aspect_grid = children.map(row => row.map(e => e.spec.aspect ?? 1))
    const log_aspect = aspect_grid.map(row => row.map(log))

    // these are exact for equipartitioned grids (row or column)
    const log_mu = mean(log_aspect.map(row => mean(row)))
    const log_uj = zip(...log_aspect).map(mean).map(x => x - log_mu)
    const log_vi = log_aspect.map(mean).map(x => log_mu - x)

    // implement findings
    widths = widths ?? normalize(log_uj.map(exp))
    heights = heights ?? normalize(log_vi.map(exp))
    const aspect_ideal = exp(log_mu - mean(widths.map(log)) + mean(heights.map(log)))

    // adjust widths and heights to account for spacing
    const [spacex, spacey] = spacing
    const [scalex, scaley] = [1 - spacex * (cols-1), 1 - spacey * (rows-1)]
    widths = widths.map(w => scalex * w)
    heights = heights.map(h => scaley * h)
    const aspect = (1-spacey*(rows-1))/(1-spacex*(cols-1)) * aspect_ideal

    // get top left positions
    const lposit = cumsum(widths.map(w => w + spacex))
    const tposit = cumsum(heights.map(h => h + spacey))
    const cranges = zip(lposit, widths).map(([l, w]) => [l, l + w])
    const rranges = zip(tposit, heights).map(([t, h]) => [t, t + h])

    return { cranges, rranges, aspect }
}

class Grid extends Group {
    constructor(args = {}) {
        let { children: children0, rows, cols, widths, heights, spacing = 0, aspect, ...attr } = THEME(args, 'Grid')
        const items = ensure_array(children0)
        spacing = ensure_vector(spacing, 2)

        // reshape children to grid
        if (rows == null && cols != null) {
            rows = Math.ceil(items.length / cols)
        } else if (cols == null && rows != null) {
            cols = Math.ceil(items.length / rows)
        } else if (rows == null && cols == null) {
            throw new Error('Either rows or cols must be specified')
        }
        let grid = reshape(items, [rows, cols])

        // fill in missing rows and columns
        const spacer = new Spacer()
        const filler = repeat(spacer, cols)
        grid = grid.map(row => padvec(row, cols, spacer))
        grid = padvec(grid, rows, filler)

        // compute layout
        const { cranges, rranges, aspect: aspect_ideal } = computeGridLayout(grid, rows, cols, { widths, heights, spacing })
        aspect ??= aspect_ideal

        // make grid
        const rects = meshgrid(rranges, cranges).map(([ ylim, xlim ]) =>
            join_limits({ h: xlim, v: ylim })
        )
        const children = zip(items, rects).map(([ child, rect ]) =>
            child.clone({ rect })
        )

        // pass to Group
        super({ children, aspect, ...attr })
        this.args = args
    }
}

//
// placement elements
//

class Points extends Group {
    constructor(args = {}) {
        const { children: children0, shape: shape0, size = D.point, ...attr0 } = THEME(args, 'Points')
        const shape = shape0 ?? new Dot()
        const [ spec, attr ] = spec_split(attr0)

        // construct children
        const children = ensure_array(children0).map(pos =>
            shape.clone({ ...attr, pos, rad: size })
        )

        // pass to Group
        super({ children, ...spec })
        this.args = args
    }
}

class Anchor extends Group {
    constructor(args = {}) {
        const { children: children0, direc = 'h', loc: loc0 = null, justify = 'center', ...attr } = args
        const child = check_singleton(children0)

        // assign spec to child
        const frac = align_frac(loc0 ?? justify)
        const children = child.clone({
            rect: join_limits({ [direc]: [ frac, frac ] }),
            align: justify,
            expand: true,
        })

        // pass to Group
        super({ children, ...attr })
        this.args = args
    }
}

class Attach extends Group {
    constructor(args = {}) {
        const { children: children0, offset = 0, size = 1, align = 'center', side, ...attr } = THEME(args, 'Attach')
        const child = check_singleton(children0)

        // get extent and map
        const extent = size + offset
        const rmap = {
            'left': [ -extent, 0, -offset, 1 ], 'right' : [ 1+offset, 0, 1+extent, 1 ],
            'top' : [ 0, -extent, 1, -offset ], 'bottom': [ 0, 1+offset, 1, 1+extent ],
        }

        // assign spec to child
        const children = child.clone({
            rect: rmap[side],
            align,
        })

        // pass to Group
        super({ children, ...attr })
        this.args = args
    }
}

class Absolute extends Element {
    constructor(args = {}) {
        const { children: children0, size, ...attr } = THEME(args, 'Absolute')
        const child = check_singleton(children0)

        // pass to Element
        super({ tag: 'g', unary: false, ...attr })
        this.args = args

        // additional props
        this.child = child
        this.size = size
    }

    inner(ctx) {
        const { prect } = ctx

        // get relative size from absolute size
        const pcent = rect_center(prect)
        const pradi = rect_radius(prect)
        const psize = ensure_vector(this.size, 2)
        const rect = radial_rect(pcent, div(psize, pradi))

        // render child element
        const ctx1 = ctx.map({ ...this.child.spec, rect })
        return this.child.svg(ctx1)
    }
}

//
// basic geometry
//

// this can have an aspect, which is utilized by layouts
class Spacer extends Element {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'Spacer')
        super({ tag: 'g', unary: true, ...attr })
        this.args = args
    }

    svg(ctx) {
        return ''
    }
}

class Line extends Element {
    constructor(args = {}) {
        let { pos1, pos2, ...attr } = THEME(args, 'Line')
        super({ tag: 'line', unary: true, ...attr })
        this.args = args

        // additional props
        this.pos1 = pos1
        this.pos2 = pos2
    }

    props(ctx) {
        const attr = super.props(ctx)
        const [ x1, y1 ] = ctx.mapPoint(this.pos1)
        const [ x2, y2 ] = ctx.mapPoint(this.pos2)
        return { x1, y1, x2, y2, ...attr }
    }
}

// plottable and coord adaptive
class UnitLine extends Line {
    constructor(args = {}) {
        const { direc = 'h', loc = D.loc, lim = D.lim, ...attr } = THEME(args, 'UnitLine')

        // construct line positions
        const [ lo, hi ] = lim
        const [ pos1, pos2 ] = (direc == 'v') ?
            [ [ loc, lo ], [ loc, hi ] ] :
            [ [ lo, loc ], [ hi, loc ] ]

        // pass to Line
        super({ pos1, pos2, ...attr })
        this.args = args
    }
}

class VLine extends UnitLine {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VLine')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HLine extends UnitLine {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HLine')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class Rect extends Element {
    constructor(args = {}) {
        let { rounded, ...attr } = THEME(args, 'Rect')

        // pass to Element
        super({ tag: 'rect', unary: true, ...attr })
        this.args = args

        // additional props
        this.rounded = rounded
    }

    props(ctx) {
        // get core attributes
        const attr = super.props(ctx)

        // get true pixel rect
        const { prect } = ctx
        let [ x, y, w, h ] = rect_box(prect, true)

        // scale border rounded
        let rx, ry
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

class Square extends Rect {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'Square')
        super({ aspect: 1, ...attr })
        this.args = args
    }
}

class Ellipse extends Element {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'Ellipse')
        super({ tag: 'ellipse', unary: true, ...attr })
        this.args = args
    }

    props(ctx) {
        const attr = super.props(ctx)
        const { prect } = ctx
        let [ cx, cy, rx, ry ] = rect_radial(prect, true)
        return { cx, cy, rx, ry, ...attr }
    }
}

class Circle extends Ellipse {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'Circle')
        super({ aspect: 1, ...attr })
        this.args = args
    }
}

class Dot extends Circle {
    constructor(args = {}) {
        const { stroke = 'black', fill = 'black', ...attr } = THEME(args, 'Dot')
        super({ stroke, fill, ...attr })
        this.args = args
    }
}

class Ray extends Line {
    constructor(args = {}) {
        const { angle, loc = D.pos, size = 0.5, ...attr } = THEME(args, 'Ray')
        const theta = angle * d2r
        const [ x, y ] = loc
        const [ rx, ry ] = ensure_vector(size, 2)
        const pos1 = [ x, y ]
        const pos2 = [ x + rx * cos(theta), y + ry * sin(theta) ]
        super({ pos1, pos2, ...attr })
        this.args = args
    }
}

//
// point strings
//

function pointstring(pixels, prec = 2) {
    return pixels.map(([ x, y ]) =>
        `${rounder(x, prec)},${rounder(y, prec)}`
    ).join(' ')
}

class Pointstring extends Element {
    constructor(args = {}) {
        const { tag, children, ...attr } = THEME(args, 'Pointstring')
        const points = ensure_array(children)

        // pass to Element
        super({ tag, unary: true, ...attr })
        this.args = args

        // additional props
        this.points = points
    }

    props(ctx) {
        const attr = super.props(ctx)
        const pixels = this.points.map(p => ctx.mapPoint(p))
        const points = pointstring(pixels, ctx.prec)
        return { points, ...attr }
    }
}

class Polyline extends Pointstring {
    constructor(args = {}) {
        const { children, ...attr } = THEME(args, 'Polyline')
        super({ tag: 'polyline', children, fill: none, ...attr })
        this.args = args
    }
}

class Polygon extends Pointstring {
    constructor(args = {}) {
        const { children, ...attr } = THEME(args, 'Polygon')
        super({ tag: 'polygon', children, ...attr })
        this.args = args
    }
}

class Triangle extends Polygon {
    constructor(args = {}) {
        const { children: children0, ...attr } = THEME(args, 'Triangle')
        const children = [[0.5, 0], [1, 1], [0, 1]]
        super({ children, ...attr })
        this.args = args
    }
}

//
// path builder
//

class Path extends Element {
    constructor(args = {}) {
        const { children, ...attr } = THEME(args, 'Path')
        const cmds = ensure_array(children)
        super({ tag: 'path', unary: true, ...attr })
        this.cmds = cmds
        this.args = args
    }

    data(ctx) {
        return this.cmds.map(c => c.data(ctx)).join(' ')
    }

    props(ctx) {
        const attr = super.props(ctx)
        const d = this.data(ctx)
        return { d, ...attr }
    }
}

class Command {
    constructor(cmd) {
        this.cmd = cmd
    }

    args(ctx) {
        return ''
    }

    data(ctx) {
        return `${this.cmd} ${this.args(ctx)}`
    }
}

class MoveCmd extends Command {
    constructor(pos) {
        super('M')
        this.pos = pos
    }

    args(ctx) {
        const [ x, y ] = ctx.mapPoint(this.pos)
        return `${rounder(x, ctx.prec)} ${rounder(y, ctx.prec)}`
    }
}

class LineCmd extends Command {
    constructor(pos) {
        super('L')
        this.pos = pos
    }

    args(ctx) {
        const [ x, y ] = ctx.mapPoint(this.pos)
        return `${rounder(x, ctx.prec)} ${rounder(y, ctx.prec)}`
    }
}

class ArcCmd extends Command {
    constructor(pos, rad, large, sweep) {
        super('A')
        this.pos = pos
        this.rad = rad
        this.large = large
        this.sweep = sweep
    }

    args(ctx) {
        const [ x1, y1 ] = ctx.mapPoint(this.pos)
        const [ rx, ry ] = ctx.mapSize(this.rad)
        return `${rounder(rx, ctx.prec)} ${rounder(ry, ctx.prec)} 0 ${this.large} ${this.sweep} ${rounder(x1, ctx.prec)} ${rounder(y1, ctx.prec)}`
    }
}

// this makes a rounded corner between two points
// the direction is by default counter-clockwise
// this assumes the cursor is at pos0
class CornerCmd {
    constructor(pos0, pos1) {
        this.pos0 = pos0
        this.pos1 = pos1
    }

    data(ctx) {
        const [ x0, y0 ] = ctx.mapPoint(this.pos0)
        const [ x1, y1 ] = ctx.mapPoint(this.pos1)

        // compute aspect ratio
        const [ dx, dy ] = [ Math.abs(x1 - x0), Math.abs(y1 - y0) ]
        const aspect = dx / dy

        // are we in quadrants 1/3 or 2/4?
        const [ top, right ] = [ x1 < x0, y1 < y0 ]
        const [ diag, wide ] = [ top == right, aspect > 1 ]

        // get corner point and fitted radius
        const [ cx, cy ] = diag ? [ x0, y1 ] : [ x1, y0 ]
        const rad = minimum(dx, dy)

        // get the intra-radial points
        const sigx = right ? -1 :  1
        const sigy = top   ?  1 : -1
        const [ x0p, y0p ] = diag ? [ cx, cy + sigy * rad ] : [ cx + sigx * rad, cy ]
        const [ x1p, y1p ] = diag ? [ cx + sigx * rad, cy ] : [ cx, cy + sigy * rad ]

        // full command
        return (
            ((diag != wide) ? `L ${rounder(x0p, ctx.prec)} ${rounder(y0p, ctx.prec)} ` : '')
            + `A ${rounder(rad, ctx.prec)} ${rounder(rad, ctx.prec)} 0 0 0 ${rounder(x1p, ctx.prec)} ${rounder(y1p, ctx.prec)} `
            + ((diag == wide) ? `L ${rounder(x1, ctx.prec)} ${rounder(y1, ctx.prec)} ` : '')
        )
    }
}

function cubic_spline_args(pos1, pos2, dir1, dir2, curve=1) {
    // compute scaled tangents
    const dist = sub(pos2, pos1).map(abs)
    const unit1 = normalize(dir1, 2)
    const unit2 = normalize(dir2, 2)
    const tan1 = mul(mul(unit1, dist), curve)
    const tan2 = mul(mul(unit2, dist), curve)

    // convert to Bernstein form
    const con1 = add(pos1, div(tan1, 3))
    const con2 = sub(pos2, div(tan2, 3))

    // make a path command
    const [ con1x, con1y ] = con1
    const [ con2x, con2y ] = con2
    const [ pos2x, pos2y ] = pos2
    return `${con1x},${con1y} ${con2x},${con2y} ${pos2x},${pos2y}`
}

class CubicSplineCmd extends Command {
    constructor(pos1, pos2, dir1, dir2, curve = 1) {
        super('C')
        this.pos1 = pos1
        this.pos2 = pos2
        this.dir1 = unit_direc(dir1)
        this.dir2 = unit_direc(dir2)
        this.curve = curve
    }

    args(ctx) {
        const pos1 = ctx.mapPoint(this.pos1)
        const pos2 = ctx.mapPoint(this.pos2)
        return cubic_spline_args(pos1, pos2, this.dir1, this.dir2, this.curve)
    }
}

class CubicSpline extends Path {
    constructor(args = {}) {
        let { pos1, pos2, dir1, dir2, curve = 1, ...attr } = THEME(args, 'CubicSpline')

        // make commands
        const move = new MoveCmd(pos1)
        const spline = new CubicSplineCmd(pos1, pos2, dir1, dir2, curve)

        // pass to Path
        super({ children: [ move, spline ], ...attr })
        this.args = args
    }
}

//
// path elements
//

class Arc extends Path {
    constructor(args = {}) {
        const { deg0, deg1, ...attr } = THEME(args, 'Arc')

        // get radian angles
        const th0 = d2r * norm_angle(deg0)
        const th1 = d2r * norm_angle(deg1)

        // get start/stop points
        const pos0 = [ 0.5 + 0.5 * cos(th0), 0.5 - 0.5 * sin(th0) ]
        const pos1 = [ 0.5 + 0.5 * cos(th1), 0.5 - 0.5 * sin(th1) ]

        // get large/sweep flags
        const delta = norm_angle(deg1 - deg0)
        const large = delta > 180 ? 1 : 0
        const sweep = delta < 0 ? 1 : 0

        // send commands to path
        const children = [
            new MoveCmd(pos0),
            new ArcCmd(pos1, rad, large, sweep),
        ]
        super({ children, ...attr })
        this.args = args
    }
}

function parse_rounded(rounded) {
    if (is_scalar(rounded)) {
        rounded = [rounded, rounded, rounded, rounded]
    } else if (is_array(rounded) && rounded.length == 2) {
        const [ rx, ry ] = rounded
        rounded = [[rx, ry], [rx, ry], [rx, ry], [rx, ry]]
    }
    return rounded.map(r => ensure_vector(r, 2))
}

// supports different rounded for each corner
class RoundedRect extends Path {
    constructor(args = {}) {
        let { children: children0, rounded = 0, border = 1, ...attr } = THEME(args, 'RoundedRect')

        // convert to array of arrays
        const [ rtl, rtr, rbr, rbl ] = parse_rounded(rounded)
        const [ rtlx, rtly ] = rtl
        const [ rtrx, rtry ] = rtr
        const [ rbrx, rbry ] = rbr
        const [ rblx, rbly ] = rbl

        // make command list
        const children = [
            new MoveCmd([1 - rtrx, 0]),
            new LineCmd([rtlx, 0]),
            new CornerCmd([rtlx, 0], [0, rtly]),
            new LineCmd([0, 1 - rbly]),
            new CornerCmd([0, 1 - rbly], [rblx, 1]),
            new LineCmd([1 - rbrx, 1]),
            new CornerCmd([1 - rbrx, 1], [1, 1 - rbry]),
            new LineCmd([1, rtry]),
            new CornerCmd([1, rtry], [1 - rtrx, 0]),
        ]

        // pass to Path
        super({ children, stroke_width: border, ...attr })
        this.args = args
    }

    // intercept prect and ensure its upright
    // otherwide CornerCmd will fail going counter-clockwise
    // TODO: could this be yet another spec property?
    props(ctx) {
        const { prect: prect0 } = ctx
        const prect = upright_rect(prect0)
        const ctx1 = ctx.clone({ prect })
        return super.props(ctx1)
    }
}

//
// arrows and fields
//

class ArrowHead extends Path {
    constructor(args = {}) {
        const { direc = 0, arc = 75, base: base0, exact = true, aspect = 1, fill = null, stroke_width = 1, stroke_linecap = 'round', stroke_linejoin = 'round', ...attr } = THEME(args, 'ArrowHead')
        const base = base0 ?? (fill != null)

        // get arc positions
        const [ arc0, arc1, arc2 ] = [ -direc, -direc - arc / 2, -direc + arc / 2 ]
        const [ dir0, dir1, dir2 ] = [ arc0, arc1, arc2 ].map(unit_direc)

        // get vertex positions
        const off = exact ? mul(dir0, -0.5 * stroke_width) : [ 0, 0 ]
        const [ fra0, fra1, fra2 ] = [ [0, 0], dir1, dir2 ].map(d => add(mul(d, -0.5), D.pos))
        const [ pos0, pos1, pos2 ] = [ fra0, fra1, fra2 ].map(f => zip(f, off))

        // make command path
        const commands = fill == null ?
            [ new MoveCmd(pos0), new LineCmd(pos1), new MoveCmd(pos0), new LineCmd(pos2) ] :
            [ new MoveCmd(pos1), new LineCmd(pos0), new LineCmd(pos2) ]
        if (base) commands.push(new MoveCmd(pos1), new LineCmd(pos2))

        // pass to element
        super({ children: commands, aspect, fill, stroke_width, stroke_linecap, stroke_linejoin, ...attr })
        this.args = args
    }
}

class Arrow extends Group {
    constructor(args = {}) {
        let { children: children0, direc: direc0 = 0, tail, stroke_width, ...attr0 } = THEME(args, 'Arrow')
        const [ head_attr, tail_attr, attr ] = prefix_split([ 'head', 'tail' ], attr0)

        // sort out direction
        const soff = 0.5 * (stroke_width ?? 1)
        const unit_vec = unit_direc(-direc0)

        // create head element
        const head_elem = new ArrowHead({ direc: direc0, stroke_width, ...head_attr })
        const children = [ head_elem ]

        // create tail element
        if (tail != null) {
            const tail_vec = unit_vec.map(z => -tail * z)
            const tail_off = mul(unit_vec, -soff)
            const tail_pos1 = zip(D.pos, tail_off)
            const tail_pos2 = add(D.pos, tail_vec)
            const tail_elem = new Line({ pos1: tail_pos1, pos2: tail_pos2, stroke_width, ...tail_attr })
            children.push(tail_elem)
        }

        // pass to Group
        super({ children, ...attr })
        this.args = args
    }
}

class Field extends Group {
    constructor(args = {}) {
        const { children: children0, shape: shape0, size = D.point, tail = 1, ...attr0 } = THEME(args, 'Field')
        const points = ensure_array(children0)
        const shape = shape0 ?? new Arrow({ tail })
        const [ spec, attr ] = spec_split(attr0)

        // create children
        const children = points.map(([ p, d ]) =>
            shape.clone({ pos: p, rad: size, spin: d, ...attr })
        )

        // pass to Group
        super({ children, ...spec })
        this.args = args
    }
}

//
// text elements
//

function escape_xml(text) {
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
}

function ensure_tail(text) {
    return `${text.trimEnd()} `
}

// no wrapping at all, clobber newlines, mainly internal use
class TextSpan extends Element {
    constructor(args = {}) {
        const { children: children0, color, voffset = C.voffset, stroke = C.none, ...attr0 } = THEME(args, 'TextSpan')
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
    props(ctx) {
        const attr = super.props(ctx)
        const { size, voffset } = this
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

    inner(ctx) {
        return this.text
    }
}

class ElemSpan extends Group {
    constructor(args = {}) {
        const { children: children0, spacing = 0.25, ...attr } = args
        const children = check_singleton(children0)
        const aspect0 = children.spec.aspect ?? 1
        const aspect = aspect0 + spacing
        const child = children.clone({ align: 'left' })
        super({ children: child, aspect, ...attr })
    }
}

function compress_spans(children, font_args = {}) {
    return children.flatMap((child, i) => {
        const first_child = i == 0
        const last_child = i == children.length - 1
        if (is_string(child)) {
            if (first_child) child = child.trimStart()
            if (!last_child) child = ensure_tail(child)
            if (last_child) child = child.trimEnd()
            const words = splitWords(child)
            return words.map(w => new TextSpan({ children: w, ...font_args }))
        } else if (child instanceof Text) {
            return child.spans.map((s, i) => {
                if (!(s instanceof TextSpan)) return s
                let { text } = s
                if (i == 0 && first_child) text = text.trimStart()
                if (i == child.spans.length - 1 && !last_child) text = ensure_tail(text)
                if (i == child.spans.length - 1 && last_child) text = text.trimEnd()
                return s.clone({ children: text, ...font_args })
            })
        } else if (child instanceof TextSpan) {
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

// wrap text or elements to multiple lines with fixed line height
class Text extends HWrap {
    constructor(args = {}) {
        const { children: children0, wrap = null, spacing = 0.1, justify = 'left', debug, ...attr0 } = THEME(args, 'Text')
        const items = ensure_array(children0)
    	const [ spec, attr ] = spec_split(attr0)

        // split into words and elements
        const spans = compress_spans(items, attr)

        // pass to HWrap
        super({ children: spans, spacing, justify, wrap, debug, ...spec })
        this.args = args

        // additional props
        this.spans = spans
    }
}

function process_marktree(tree) {
    if (is_element(tree)) return tree

    // process nodes recursively
    const { type, children, value } = tree
    if (type == 'paragraph') {
        return children.map(x => process_marktree(x))
    } else if (type == 'text') {
        return value
    } else if (type == 'strong') {
        const children1 = children.map(c => process_marktree(c))
        return new Text({ children: children1, font_weight: bold })
    } else if (type == 'emphasis') {
        const children1 = children.map(c => process_marktree(c))
        return new Text({ children: children1, font_style: 'italic' })
    } else if (type == 'inlineMath') {
        return new Latex({ children: value })
    } else {
        console.error(`Unsupported markdown type: ${type}`)
    }
}

class Markdown extends Text {
    constructor(args = {}) {
        const { children: children0, ...attr } = THEME(args, 'Markdown')
        const children = ensure_array(children0)
        const tree = children.flatMap(c => is_string(c) ? parseMarkdown(c) : c)
        const nodes = tree.flatMap(x => process_marktree(x))
        super({ children: nodes, ...attr })
    }
}

class TextStack extends VStack {
    constructor(args = {}) {
        const { children: children0, wrap = null, ...attr0 } = THEME(args, 'TextStack')
        const items = ensure_array(children0)
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)

        // apply wrap to children
        const rows = items.map(c => c.clone({ ...font_attr, ...text_attr, wrap }))
        const children = wrap != null ? intersperse(rows, new Spacer({ aspect: wrap })) : rows

        // pass to VStack
        super({ children, ...attr })
        this.args = args
    }
}

class TextBox extends Box {
    constructor(args = {}) {
        const { children: children0, padding = 0.1, justify, wrap, debug, ...attr0 } = THEME(args, 'TextBox')
        const text = ensure_array(children0)
        const [ font_attr0, text_attr, attr ] = prefix_split([ 'font', 'text' ], attr0)
        const font_attr = prefix_join('font', font_attr0)
        const children = new Text({ children: text, justify, wrap, debug, ...text_attr, ...font_attr })
        super({ children, padding, debug, ...attr })
        this.args = args
    }
}

class TextFrame extends TextBox {
    constructor(args = {}) {
        const { border = 1, rounded = 0.05, ...attr } = THEME(args, 'TextFrame')
        super({ border, rounded, ...attr })
    }
}

// calculate font-size within box, iterative but still BlooP!
function get_font_size(text, w, h, spacing, fargs) {
    // best guess font size
    const tw = textSizer(text, fargs)
    const lw = ( tw * h ) / w
    const { lines } = wrapText(text, lw, fargs)
    const nmin = lines.length
    const nmax = sum(lines.map(l => l.length))

    // account for ragged newlines
    for (let n = nmin; n <= nmax; n++) {
        const fs = h / ( n + (n - 1) * spacing )
        const lw = w / fs
        const { lines, widths } = wrapText(text, lw, fargs)
        if (lines.length <= n) {
            const mw = max(widths)
            return fs * mw < w ? fs : w / mw
        }
    }
}

// text fits outer shape
// font_scale is proportionally scaled
// font_size is absolutely scaled
class TextFlex extends Element {
    constructor(args = {}) {
        const { children: children0, font_scale, font_size, spacing = 0.1, color, voffset = C.voffset, ...attr0 } = THEME(args, 'TextFlex')
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

    props(ctx) {
        const attr = super.props(ctx)
        return { ...this.font_args, ...attr }
    }

    inner(ctx) {
        const { prect } = ctx
        const [ x, y, w, h ] = rect_box(prect)

        // handle font size specification
        let fs = null
        if (this.font_size != null) {
            fs = this.font_size
        } else if (this.font_scale != null) {
            fs = this.font_scale * h
        } else {
            fs = get_font_size(this.text, w, h, this.spacing, this.font_args)
        }
        const lh = fs * ( 1 + this.spacing )

        // compute wrapped rows
        const mw = w / fs
        const { lines } = wrapText(this.text, mw, this.font_args)
        const rows = lines.map(r => r.join(' '))

        // map line indices to positions
        const y1 = y + ( 1 + this.voffset ) * fs
        const elems = rows.map((r, i) => `<tspan x="${x}" y="${y1 + i * lh}">${r}</tspan>`)
        return `<text font-size="${fs}">\n${elems.join('\n')}\n</text>`
    }
}

// TODO: this is slow. can we get katex back somehow?
class Latex extends Element {
    constructor(args = {}) {
        const { children, display = false, voffset = C.voffset, ...attr } = THEME(args, 'Latex')
        const tex = check_string(children)

        // render with mathjax (or do nothing if mathjax is not available)
        let math = '', svg_attr = {}, vshift = 0
        if (typeof MathJax !== 'undefined') {
            // render with mathjax
            const { svg, viewBox, width, height, valign } = mathjax.render(tex, { display })

            // handle vertical offset
            const vfactor = display ? 0.5 : 0.25
            const vshift0 = voffset + valign + vfactor * (1 - height)

            // console.error('======== LATEX ========')
            // console.error(text)
            // console.error(viewBox)
            // console.error(width)
            // console.error(height)
            // console.error(valign)
            // console.error(svg.outerHTML)
            // console.error('======== LATEX ========')

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

    props(ctx) {
        const attr = super.props(ctx)
        const { prect } = ctx
        const [ x, y0, w, h ] = rect_box(prect, true)
        const y = y0 + this.vshift * h
        return { x, y, width: w, height: h, ...attr }
    }

    inner(ctx) {
        return `\n${this.math}\n`
    }
}

class Equation extends Latex {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'Equation')
        super({ display: true, ...attr })
    }
}

//
// symbolic plotters
//

// GRAPHABLE ELEMENTS: SymPoints, SymLine, SymPoly, SymFill, SymField
// these should take xlim/ylim/coord and give precedence to xlim/ylim over coord
// they should compute their coordinate limits and report them in coord (for Graph)

// determines actual values given combinations of limits, values, and functions
function sympath({ fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N } = {}) {
    fx = ensure_function(fx)
    fy = ensure_function(fy)

    // handle underspecified case
    if (
        tlim == null && tvals == null &&
        xlim == null && xvals == null &&
        ylim == null && yvals == null
    ) {
        return [ [], [], [] ]
    }

    // determine data size
    const Ns = new Set(
        [ tvals, xvals, yvals ]
        .filter(v => v != null)
        .map(v => v.length)
    )
    if (Ns.size > 1) {
        throw new Error(`Error: data sizes must be in aggreement but got ${[...Ns]}`)
    } else if (Ns.size == 1) {
        N = [...Ns][0]
    } else {
        N = N ?? D.N
    }

    // generate tvals
    tlim = tlim ?? D.lim
    tvals = tvals ?? linspace(...tlim, N)

    // compute data values
    if (fx != null && fy != null) {
        xvals = tvals.map(fx)
        yvals = tvals.map(fy)
    } else if (fy != null) {
        xvals ??= linspace(...xlim, N)
        yvals = xvals.map(fy)
    } else if (fx != null) {
        yvals ??= linspace(...ylim, N)
        xvals = yvals.map(fx)
    } else if (yvals != null && xvals == null) {
        xlim ??= D.lim
        xvals = linspace(...xlim, N)
    } else if (xvals != null && yvals == null) {
        ylim ??= D.lim
        yvals = linspace(...ylim, N)
    }

    // filter out nan values
    const data = zip(tvals, xvals, yvals).filter(
        ([t, x, y]) => !isNaN(t) && !isNaN(x) && !isNaN(y)
    )

    // return dataset
    return zip(...data)
}

// a component is a function that returns an element
function ensure_shapefunc(f) {
    const f1 = ensure_function(f)
    return (...a) => f1(...a)
}

class SymPoints extends Group {
    constructor(args = {}) {
        const { children: children0, fx, fy, size = D.point, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, shape: shape0, ...attr0 } = THEME(args, 'SymPoints')
        const [ spec, attr ] = spec_split(attr0)
        const shape = ensure_singleton(shape0 ?? children0)
        const fshap = ensure_shapefunc(shape ?? new Dot())
        const fsize = ensure_function(size)
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0)

        // compute point values
        const [tvals1, xvals1, yvals1] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // make points
        const points = zip(tvals1, xvals1, yvals1).filter(
            ([t, x, y]) => (x != null) && (y != null)
        )

        // make children
        const children = enumerate(points).map(([i, [t, x, y]]) => {
            const sh = fshap(x, y, t, i)
            const sz = sh.args.rad ?? fsize(x, y, t, i)
            return sh.clone({ pos: [x, y], rad: sz, ...attr })
        })

        // compute coords
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to element
        super({ children, coord, ...spec })
        this.args = args
    }
}

class SymLine extends Polyline {
    constructor(args = {}) {
        const { children: children0, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr } = THEME(args, 'SymLine')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0)

        // compute path values
        const [ tvals1, xvals1, yvals1 ] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = zip(xvals1, yvals1).filter(
            ([ x, y ]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Polyline
        super({ children, coord, ...attr })
        this.args = args
    }
}

class SymPoly extends Polygon {
    constructor(args = {}) {
        const { children: children0, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr } = THEME(args, 'SymPoly')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0)

        // compute point values
        const [tvals1, xvals1, yvals1] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = zip(xvals1, yvals1).filter(
            ([x, y]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Polygon
        super({ children, coord, ...attr })
        this.args = args
    }
}

class SymFill extends Polygon {
    constructor(args = {}) {
        const { children: children0, fx1, fy1, fx2, fy2, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, stroke = none, fill = gray, coord: coord0, ...attr } = THEME(args, 'SymFill')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0)

        // compute point values
        const [tvals1, xvals1, yvals1] = sympath({
            fx: fx1, fy: fy1, xlim, ylim, tlim, xvals, yvals, tvals, N
        })
        const [tvals2, xvals2, yvals2] = sympath({
            fx: fx2, fy: fy2, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = [...zip(xvals1, yvals1), ...zip(xvals2, yvals2).reverse()].filter(
            ([x, y]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Polygon
        super({ children, stroke, fill, coord, ...attr })
        this.args = args
    }
}

function default_arrow(direc) {
    const theta = is_scalar(direc) ? direc : vector_angle(direc)
    const arrow = new Arrow({ pos: [1, 0.5], direc: 0, tail: 1 })
    return new Box({ children: arrow, spin: theta })
}

class SymField extends SymPoints {
    constructor(args = {}) {
        const { children: children0, func, xlim: xlim0, ylim: ylim0, N = 10, size: size0, coord: coord0, ...attr } = THEME(args, 'SymField')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0)
        const shape = ensure_singleton(children0) ?? default_arrow
        const size = size0 ?? 0.25 / N

        // create points and shape function
        const points = (xlim != null && ylim != null) ? lingrid(xlim, ylim, N) : []
        const fshap = (x, y, t, i) => shape(func(x, y))

        // compute real limits
        const [ xvals, yvals ] = points.length > 0 ? zip(...points) : [ [], [] ]
        const coord = coord0 ?? detect_coords(xvals, yvals, xlim, ylim)

        // pass to SymPoints
        super({ children: fshap, xvals, yvals, size, coord, ...attr })
        this.args = args
    }
}

//
// networks
//

function get_direction(p1, p2) {
    const [ x1, y1 ] = p1
    const [ x2, y2 ] = p2

    const [ dx, dy ] = [ x2 - x1, y2 - y1 ]
    const [ ax, ay ] = [ abs(dx), abs(dy) ]

    return (dy <= -ax) ? 'n' :
           (dy >=  ax) ? 's' :
           (dx >=  ay) ? 'e' :
           (dx <= -ay) ? 'w' :
           null
}

class ArrowPath extends Group {
    constructor(args = {}) {
        let { children: children0, pos1, pos2, dir1, dir2, arrow, arrow1, arrow2, arrow_size = 0.03, stroke_width, stroke_linecap, fill, coord, ...attr0 } = THEME(args, 'ArrowPath')
        let [ path_attr, arrow1_attr, arrow2_attr, arrow_attr, attr ] = prefix_split(
            [ 'path', 'arrow1', 'arrow2', 'arrow' ], attr0
        )
        arrow1 = arrow ?? arrow1 ?? false
        arrow2 = arrow ?? arrow2 ?? true

        // accumulate arguments
        const stroke_attr = { stroke_linecap, stroke_width }
        path_attr = { ...stroke_attr, ...path_attr }
        arrow1_attr = { fill, ...stroke_attr, ...arrow_attr, ...arrow1_attr }
        arrow2_attr = { fill, ...stroke_attr, ...arrow_attr, ...arrow2_attr }

        // set default directions (gets normalized later)
        const direc = sub(pos2, pos1)
        dir1 = unit_direc(dir1 ?? direc)
        dir2 = unit_direc(dir2 ?? direc)

        // get arrow offsets
        const soff = 0.5 * (stroke_width ?? 1)
        const pos1o = arrow1 ? zip(pos1, mul(dir1,  soff)) : pos1
        const pos2o = arrow2 ? zip(pos2, mul(dir2, -soff)) : pos2

        // make cubic spline shaft
        const shaft = new CubicSpline({ pos1: pos1o, pos2: pos2o, dir1, dir2, coord, ...path_attr })
        const children = [ shaft ]

        // make start arrowhead
        if (arrow1) {
            const ang1 = vector_angle(dir1)
            const head_beg = new ArrowHead({ direc: 180 - ang1, pos: pos1, rad: arrow_size, ...arrow1_attr })
            children.push(head_beg)
        }

        // make end arrowhead
        if (arrow2) {
            const ang2 = vector_angle(dir2)
            const head_end = new ArrowHead({ direc: -ang2, pos: pos2, rad: arrow_size, ...arrow2_attr })
            children.push(head_end)
        }

        // pass to Group
        super({ children, coord, ...attr })
        this.args = args
    }
}

class Node extends Frame {
    constructor(args = {}) {
        const { children, label, yrad = 0.1, rounded = 0.05, padding = 0.1, ...attr } = THEME(args, 'Node')

        // pass to Frame
        super({ children, yrad, rounded, padding, ...attr })
        this.args = args

        // additional props
        this.label = label
    }
}

class TextNode extends Node {
    constructor(args = {}) {
        const { children, wrap = null, justify = 'center', ...attr } = THEME(args, 'TextNode')
        const [ text_attr, node_attr ] = prefix_split([ 'text' ], attr)
        const text = new Text({ children, wrap, justify, ...text_attr })
        super({ children: text, ...node_attr })
        this.args = args
    }
}

function anchor_point(rect, direc) {
    const [ xmin, ymin, xmax, ymax] = rect
    const [ xmid, ymid ] = rect_center(rect)
    return (direc == 'n') ? [ xmid, ymin ] :
           (direc == 's') ? [ xmid, ymax ] :
           (direc == 'e') ? [ xmax, ymid ] :
           (direc == 'w') ? [ xmin, ymid ] :
           null
}

class Edge extends Element {
    constructor(args = {}) {
        const { node1, node2, dir1, dir2, curve = 2, ...attr } = THEME(args, 'EdgePath')

        // pass to Element
        super({ tag: 'g', unary: false, ...attr })
        this.args = args

        // additional props
        this.node1 = node1
        this.node2 = node2
        this.dir1 = dir1
        this.dir2 = dir2
        this.curve = curve
    }

    svg(ctx) {
        // get core attributes
        const attr = super.props(ctx)

        // get mapped node rects
        const rect1 = this.node1.rect(ctx)
        const rect2 = this.node2.rect(ctx)

        // get emanation directions
        const center1 = rect_center(rect1)
        const center2 = rect_center(rect2)
        const direc1 = this.dir1 ?? get_direction(center1, center2)
        const direc2 = this.dir2 ?? get_direction(center2, center1)

        // get anchor points and tangent vectors
        const pos1 = anchor_point(rect1, direc1)
        const pos2 = anchor_point(rect2, direc2)
        const dir1 = cardinal_direc(direc1)
        const dir2 = mul(cardinal_direc(direc2), -1)

        const arrowpath = new ArrowPath({ pos1, pos2, dir1, dir2, path_curve: this.curve, coord: ctx.coord, ...attr })
        return arrowpath.svg(ctx)
    }
}

class Network extends Group {
    constructor(args = {}) {
        const { children: children0, xlim, ylim, coord: coord0, ...attr0 } = THEME(args, 'Network')
        const [ node_attr, edge_attr, attr ] = prefix_split([ 'node', 'edge' ], attr0)
        const coord = coord0 ?? join_limits({ h: xlim, v: ylim })

        // process nodes and make label map
        const nodes = children0.filter(c => c instanceof Node).map(n => n.clone({ ...node_attr, ...n.args }))
        const nmap = new Map(nodes.map(n => [ n.label, n ]))

        // process children in original order
        const children = children0.map(c => {
            if (c instanceof Edge) {
                // create arrow path from edge
                const n1 = nmap.get(c.args.node1)
                const n2 = nmap.get(c.args.node2)
                return c.clone({ ...edge_attr, ...c.args, node1: n1, node2: n2, coord })
            } else if (c instanceof Node) {
                // return the already processed node from the map
                return nmap.get(c.label)
            } else {
                // other elements pass through unchanged
                return c
            }
        })

        // pass to Group
        super({ children, coord, ...attr })
        this.args = args
    }
}

//
// bar components
//

class Bar extends RoundedRect {
    constructor(args = {}) {
        let { fill = 'lightgray', border = 1, rounded, ...attr } = THEME(args, 'Bar')
        rounded = rounded === true ? [ 0.1, 0.1, 0, 0 ] : rounded
        super({ fill, rounded, border, ...attr })
        this.args = args
    }
}

class VBar extends Bar {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VBar')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HBar extends Bar {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HBar')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class Bars extends Group {
    constructor(args = {}) {
        const { children: children0, direc = 'v', width = 0.75, zero = 0, ...attr0 } = THEME(args, 'Bars')
        const [ spec, attr ] = spec_split(attr0)
        const bars = ensure_array(children0)
        const idirec = invert_direc(direc)

        // make rects from sizes
        const children = bars.map((child, i) => {
            if (is_scalar(child)) child = new Bar({ direc, size: child })
            const { loc = i, size } = child.attr
            const rect = join_limits({
                [direc]: [ zero, size ],
                [idirec]: [ loc - width / 2, loc + width / 2 ],
            })
            return child.clone({ rect, ...attr })
        })

        // pass to Group
        super({ children, coord: 'auto', ...spec })
        this.args = args
    }
}

class VBars extends Bars {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VBars')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HBars extends Bars {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HBars')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

//
// plotting elements
//

function ensure_ticklabel(label, args = {}) {
    const { prec = D.prec, ...attr } = args
    if (is_element(label)) return label.clone(attr)
    const [ loc, str ] = is_scalar(label) ? [ label, label ] : label
    return new TextSpan({ children: rounder(str, prec), loc, ...attr })
}

class Scale extends Group {
    constructor(args = {}) {
        const { children: children0, locs, direc = 'h', span = D.lim, ...attr0 } = THEME(args, 'Scale')
        const [ spec, attr ] = spec_split(attr0)
        const tick_dir = invert_direc(direc)

        // make tick lines
        const children = locs.map(t => {
            const rect = join_limits({ [direc]: [t, t], [tick_dir]: span })
            return new UnitLine({ direc: tick_dir, rect, expand: true, ...attr })
        })

        // set coordinate system
        super({ children, ...spec })
        this.args = args
    }
}

class VScale extends Scale {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VScale')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HScale extends Scale {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HScale')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

// label elements must have an aspect to properly size them
class Labels extends Group {
    constructor(args = {}) {
        const { children: children0, direc = 'h', justify: justify0 = null, loc: subloc = null, prec = D.prec, ...attr0 } = THEME(args, 'Labels')
        const items = ensure_array(children0)
        const [ spec, attr ] = spec_split(attr0)
        const justify = justify0 ?? (direc == 'h' ? 'center' : 'right')

        // place tick boxes using expanded lines
        const children = items.map(c0 => {
            const c = ensure_ticklabel(c0, attr, prec)
            const { loc } = c.attr
            const rect = join_limits({ [direc]: [ loc, loc ] })
            return new Anchor({ children: c, rect, expand: true, aspect: 1, justify, loc: subloc })
        })

        // pass to Group
        super({ children, ...spec })
        this.args = args
    }
}

class HLabels extends Labels {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HLabels')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VLabels extends Labels {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VLabels')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

function get_tick_lim(lim) {
    if (lim == 'inner') {
        return [0.5, 1]
    } else if (lim == 'outer') {
        return [0, 0.5]
    } else if (lim == 'both') {
        return [0, 1]
    } else if (lim == 'none') {
        return [0, 0]
    } else {
        return lim
    }
}

// this is designed to be plotted directly
// this takes a nested coord approach, not entirely sure about that
class Axis extends Group {
    constructor(args = {}) {
        const { children, lim = D.lim, direc, ticks: ticks0, tick_side = 'inner', label_side = 'outer', label_size = 1.5, label_offset = 0.75, label_justify: label_justify0 = null, label_loc = null, discrete = false, prec = D.prec, debug, ...attr0 } = THEME(args, 'Axis')
        const [ label_attr, tick_attr, line_attr, attr ] = prefix_split([ 'label', 'tick', 'line' ], attr0)
        const tick_lim = get_tick_lim(tick_side)
        const [ tick_lo, tick_hi ] = tick_lim

        // get tick and label limits
        const label_justify = label_justify0 ?? ((direc == 'v') ? (label_side == 'outer' ? 'right' : 'left') : 'center')
        const label_base = (label_side == 'inner') ? (tick_hi + label_offset) : (tick_lo - label_offset - label_size)
        const label_lim = [ label_base, label_base + label_size ]

        // set up one-sides coordinate system
        const idirec = invert_direc(direc)
        const coord = join_limits({ [direc]: lim })
        const scale_rect = join_limits({ [idirec]: tick_lim })
        const label_rect = join_limits({ [idirec]: label_lim })

        // extract tick information
        const ticks = ticks0 != null ? (is_scalar(ticks0) ? linspace(...lim, ticks0) : ticks0) : []
        const labels = children ?? ticks.map(t => ensure_ticklabel(t, label_attr, prec))
        const locs = labels.map(c => c.attr.loc)

        // accumulate children
        const cline = new UnitLine({ direc, lim, coord, ...line_attr })
        const scale = new Scale({ locs, direc, rect: scale_rect, coord, debug, ...tick_attr })
        const label = new Labels({ children: labels, direc, justify: label_justify, loc: label_loc, rect: label_rect, coord, debug })

        // pass to Group
        super({ children: [ cline, scale, label ], debug, ...attr })
        this.args = args

        // additional props
        this.locs = locs
    }
}

class HAxis extends Axis {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HAxis')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VAxis extends Axis {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VAxis')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class BoxLabel extends Attach {
    constructor(args = {}) {
        const { children: children0, size, offset, side, ...attr0 } = args
        const text = check_singleton(children0)
        const [ spec, attr ] = spec_split(attr0)
        const label = is_element(text) ? text : new TextSpan({ children: text, ...attr })
        super({ children: label, side, size, offset, ...spec })
        this.args = args
    }
}

class Mesh extends Scale {
    constructor(args = {}) {
        const { children: children0, locs: locs0 = 10, direc = 'h', lim = D.lim, span = D.lim, ...attr } = THEME(args, 'Mesh')
        const locs = is_scalar(locs0) ? linspace(...lim, locs0) : locs0
        const coord = join_limits({ [direc]: lim })
        super({ locs, direc, coord, span, ...attr })
        this.args = args
    }
}

class HMesh extends Mesh {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HMesh')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VMesh extends Mesh {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VMesh')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

function ensure_legendbadge(c, attr = {}) {
    if (is_element(c)) return c
    if (is_string(c)) {
        attr = { stroke: c, ...attr }
    } else if (is_object(c)) {
        attr = { ...c, ...attr }
    } else {
        throw new Error(`Unrecognized legend badge specification: ${c}`)
    }
    return new HLine({ aspect: 1, ...attr })
}

function ensure_legendlabel(label, attr = {}) {
    if (is_element(label)) return label
    if (is_string(label)) {
        return new TextSpan({ children: label, ...attr })
    } else {
        throw new Error(`Unrecognized legend label specification: ${label}`)
    }
}

// TODO: have a .badge/.label api for plottable elements
class Legend extends Frame {
    constructor(args = {}) {
        const { children: children0, lines, vspacing = 0.1, hspacing = 0.25, rounded = 0.025, padding = 0.05, fill = white, stroke = darkgray, justify = 'left', debug, ...attr0 } = THEME(args, 'Legend')
        const children = ensure_array(children0)
        const [ badge_attr, text_attr, attr ] = prefix_split([ 'badge', 'text' ], attr0)

        // construct legend badges and labels
        const badges = children.map(b => ensure_legendbadge(b, badge_attr))

        // construct legend grid
        const rows = badges.map(b => {
            const { label } = b.attr
            const { aspect } = b.spec
            const b1 = b.clone({ aspect: aspect ?? 1, label: null })
            const spacer = new Spacer({ aspect: hspacing })
            const text = ensure_legendlabel(label, text_attr)
            return new HStack({ children: [ b1, spacer, text ], debug })
        })
        const vs = new VStack({ children: rows, spacing: vspacing, justify, even: true })

        // pass to Frame
        super({ children: vs, rounded, padding, fill, stroke, ...attr })
        this.args = args
    }
}

// find minimal containing limits
function outer_limits(children, { xlim, ylim, padding = 0 } = {}) {
    if (children.length == 0) return null

    // pull in child coordinate system
    const coord0 = merge_rects(children.map(c => c.spec.coord))
    const { xlim: xlim0, ylim: ylim0 } = resolve_limits(xlim, ylim, coord0)

    // expand with padding
    const [ xpad, ypad ] = ensure_vector(padding, 2)
    xlim = expand_limits(xlim0 ?? D.lim, xpad)
    ylim = expand_limits(ylim0 ?? D.lim, ypad)

    // return coordinate system
    return join_limits({ h: xlim, v: ylim })
}

// plottable things should accept xlim/ylim and may report coords on their own
class Graph extends Group {
    constructor(args = {}) {
        let { children: children0, xlim, ylim, coord = 'auto', aspect = 'auto', padding = 0, flip = true, ...attr } = THEME(args, 'Graph')
        const elems = ensure_array(children0)

        // get default outer limits
        coord = coord == 'auto' ? outer_limits(elems, { xlim, ylim, padding }) : coord
        aspect = aspect == 'auto' ? rect_aspect(coord) : aspect

        // flip coordinate system if requested
        if (flip) coord = flip_rect(coord, true)

        // map coordinate system to all elements
        const children = elems.map(e => {
            if (e.spec.rect != null) {
                return new Group({ children: e, coord })
            } else {
                return e.clone({ coord })
            }
        })

        // pass to Group
        super({ children, aspect, ...attr })
        this.args = args
    }
}

class Plot extends Box {
    constructor(args = {}) {
        let {
            children: children0, xlim, ylim, xaxis = true, yaxis = true, xticks = 5, yticks = 5, xanchor, yanchor, grid = null, xgrid = null, ygrid = null, xlabel = null, ylabel = null, title = null, tick_size = 0.015, label_size = 0.05, label_offset = [ 0.11, 0.18 ], title_size = 0.075, title_offset = 0.05, xlabel_size, ylabel_size, xlabel_offset, ylabel_offset, xtick_size, ytick_size, padding = 0, margin = 0, aspect: aspect0 = 'auto', clip = false, debug = false, ...attr0
        } = THEME(args, 'Plot')
        const elems = ensure_array(children0, false)

        // determine coordinate system and aspect
        const coord = outer_limits(elems, { xlim, ylim, padding })
        const [ xmin, ymin, xmax, ymax ] = coord
        xlim = [ xmin, xmax ]
        ylim = [ ymin, ymax ]

        // determine aspect and tick/size/offset
        const aspect = aspect0 == 'auto' ? rect_aspect(coord) : aspect0
        const [ xtick_size0, ytick_size0 ] = aspect_invariant(tick_size, aspect)
        const [ xlabel_size0, ylabel_size0 ] = aspect_invariant(label_size, aspect)
        const [ xlabel_offset0, ylabel_offset0 ] = aspect_invariant(label_offset, aspect)

        // default anchor points
        xanchor ??= ymin
        yanchor ??= xmin

        // default grid values
        xgrid ??= grid
        ygrid ??= grid

        // set aspect aware default values
        xtick_size ??= xtick_size0
        ytick_size ??= ytick_size0
        xlabel_size ??= xlabel_size0
        ylabel_size ??= ylabel_size0
        xlabel_offset ??= xlabel_offset0
        ylabel_offset ??= ylabel_offset0

        // some advanced piping
        let [
            xaxis_attr, yaxis_attr, axis_attr, xtick_label_attr, xtick_attr, ytick_label_attr, ytick_attr, tick_label_attr, tick_attr, xgrid_attr, ygrid_attr, grid_attr, xlabel_attr, ylabel_attr, label_attr, title_attr, attr
        ] = prefix_split([
            'xaxis', 'yaxis', 'axis', 'xtick_label', 'xtick', 'ytick_label', 'ytick', 'tick_label', 'tick', 'xgrid', 'ygrid', 'grid', 'xlabel', 'ylabel', 'label', 'title'
        ], attr0)
        xtick_attr = { ...xtick_attr, ...tick_attr }
        ytick_attr = { ...ytick_attr, ...tick_attr }
        xtick_label_attr = { ...xtick_label_attr, ...tick_label_attr }
        ytick_label_attr = { ...ytick_label_attr, ...tick_label_attr }
        xaxis_attr = { ...axis_attr, ...xaxis_attr, ...prefix_join('tick', xtick_attr), ...prefix_join('label', xtick_label_attr) }
        yaxis_attr = { ...axis_attr, ...yaxis_attr, ...prefix_join('tick', ytick_attr), ...prefix_join('label', ytick_label_attr) }
        xgrid_attr = { ...grid_attr, ...xgrid_attr }
        ygrid_attr = { ...grid_attr, ...ygrid_attr }
        xlabel_attr = { size: xlabel_size, offset: xlabel_offset, ...label_attr, ...xlabel_attr }
        ylabel_attr = { size: ylabel_size, offset: ylabel_offset, ...label_attr, ...ylabel_attr }
        title_attr = { size: title_size, offset: title_offset, ...title_attr }

        // collect axis elements
        const bg_elems = []
        const fg_elems = []

        // default xaxis generation
        if (xaxis === true) {
            const xtick_size1 = xtick_size * (ymax - ymin)
            const xaxis_yrect = [ xanchor - xtick_size1, xanchor + xtick_size1 ]
            xaxis = new HAxis({ ticks: xticks, lim: xlim, xrect: xlim, yrect: xaxis_yrect, ...xaxis_attr })
            fg_elems.push(xaxis)
        } else if (xaxis === false) {
            xaxis = null
        }

        // default yaxis generation
        if (yaxis === true) {
            const ytick_size1 = ytick_size * (xmax - xmin)
            const yaxis_xrect = [ yanchor - ytick_size1, yanchor + ytick_size1 ]
            yaxis = new VAxis({ ticks: yticks, lim: ylim, xrect: yaxis_xrect, yrect: ylim, ...yaxis_attr })
            fg_elems.push(yaxis)
        } else if (yaxis === false) {
            yaxis = null
        }

        // automatic xgrid generation
        if (xgrid != null) {
            const locs = is_array(xgrid) ? xgrid : (xaxis != null) ? xaxis.locs : null
            xgrid = new HMesh({ locs, lim: xlim, rect: coord, ...xgrid_attr })
            bg_elems.push(xgrid)
        } else {
            xgrid = null
        }

        // automatic ygrid generation
        if (ygrid != null) {
            const locs = is_array(ygrid) ? ygrid : (yaxis != null) ? yaxis.locs : null
            ygrid = new VMesh({ locs, lim: ylim, rect: coord, ...ygrid_attr })
            bg_elems.push(ygrid)
        } else {
            ygrid = null
        }

        // create graph from core elements
        const elems1 = [ ...bg_elems, ...elems ].filter(z => z != null)
        const graph = new Graph({ children: elems1, coord, aspect: null, clip })
        const fg_graph = new Graph({ children: fg_elems, coord, aspect: null })
        const children = [ graph, fg_graph ]

        // optional xaxis label
        if (xlabel != null) {
            xlabel = new BoxLabel({ children: xlabel, side: 'bottom', debug, ...xlabel_attr })
            children.push(xlabel)
        }

        // optional yaxis label
        if (ylabel != null) {
            const ylabel_text = new TextSpan({ children: ylabel, ...ylabel_attr, rotate: -90 })
            ylabel = new BoxLabel({ children: ylabel_text, side: 'left', debug, ...ylabel_attr })
            children.push(ylabel)
        }

        // optional plot title
        if (title != null) {
            title = new BoxLabel({ children: title, side: 'top', debug, ...title_attr })
            children.push(title)
        }

        // pass to Box
        const inner = new Group({ children, aspect })
        super({ children: inner, margin, ...attr })
        this.args = args
    }
}

class BarPlot extends Plot {
    constructor(args = {}) {
        const { children: children0, direc = 'v', aspect = 2, xtick_side = 'outer', ...attr0 } = THEME(args, 'BarPlot')
        const [ bar_attr, attr ] = prefix_split([ 'bar' ], attr0)
        const children = ensure_array(children0)

        // handle data array case
        const sibs = children.map(child => {
            if (is_element(child)) return child
            const [ label, size ] = is_scalar(child) ? [ child, child ] : child
            return new Bar({ label, size, ...bar_attr })
        })

        // extract labels and create bars
        const labs = sibs.map(child => child.attr.label)
        const bars = new Bars({ children: sibs, direc, ...bar_attr })

        // determine axis ticks
        const tickdir = direc === 'v' ? 'x' : 'y'
        const itickdir = tickdir === 'x' ? 'y' : 'x'
        const [ tname, ticks ] = [ `${tickdir}ticks`, enumerate(labs) ]
        const [ lname, limit ] = [ `${tickdir}lim`, [ -0.75, children.length - 0.25 ] ]
        const [ gname, grid ] = [ `${itickdir}grid`, true ]

        // pass on to Plot
        super({ children: bars, [tname]: ticks, [lname]: limit, aspect, [gname]: grid, xtick_side, ...attr })
        this.args = args
    }
}

//
// slides
//

// TODO: use mask to clip frame for title box (then we can make it transparent)
// TODO: title doesn't get rotated on spin
class TitleFrame extends Box {
    constructor(args = {}) {
        const { children: children0, title, title_size = 0.05, title_fill, title_offset = 0, title_rounded = 0.1, margin, ...attr0 } = THEME(args, 'TitleFrame')
        const child = check_singleton(children0)
        const [ title_attr, attr ] = prefix_split(['title'], attr0)

        // make outer box
        const box = new Frame({ children: child, ...attr })

        // make optional title box
        let title_box = null
        if (title != null) {
            const title_pos = [ 0.5, title_size * title_offset ]
            const title_rad = [ 0.5, title_size ]
            title_box = new TextFrame({ children: title, pos: title_pos, rad: title_rad, fill: title_fill, rounded: title_rounded, ...title_attr })
        }

        // pass to Box for margin
        super({ children: [ box, title_box ], margin })
        this.args = args
    }
}

class Slide extends TitleFrame {
    constructor(args = {}) {
        const { children: children0, aspect, padding = 0.1, margin = 0.1, border = 1, rounded = 0.01, border_stroke = '#bbb', title_size = 0.05, title_text_font_weight = C.bold, wrap = 25, spacing, justify = 'left', ...attr0 } = THEME(args, 'Slide')
        const children = ensure_array(children0)
        const [ text_attr, attr ] = prefix_split([ 'text' ], attr0)

        // stack up children
        const stack = new TextStack({ children, spacing, justify, wrap, ...text_attr })

        // pass to TitleFrame
        super({ children: stack, aspect, padding, margin, border, rounded, border_stroke, title_size, title_text_font_weight, ...attr })
        this.args = args
    }
}

//
// images
//

class Image extends Element {
    constructor(args = {}) {
        super({ tag: 'image', unary: true, ...attr1 })
        this.args = args
    }

    props(ctx) {
        const attr = super.props(ctx)
        const prect = ctx.mapRect()
        const [ x, y, w, h ] = rect_radial(prect)
        return { x, y, width: w, height: h, ...attr }
    }
}

//
// scripting
//

const ELEMS = {
    Context, Element, Debug, Group, Svg, Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Polyline, Polygon, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, Arc, Triangle, Arrow, Field, TextSpan, Text, Markdown, TextBox, TextFrame, TextStack, TextFlex, Latex, Equation, TitleFrame, ArrowHead, ArrowPath, Node, TextNode, Edge, Network, SymPoints, SymLine, SymPoly, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Graph, Plot, BarPlot, Legend, Slide, Image
}

const VALS = [
    ...Object.values(ELEMS), range, linspace, enumerate, repeat, meshgrid, lingrid, hexToRgba, interp, palette, gzip, zip, reshape, split, concat, sum, prod, exp, log, sin, cos, tan, min, max, minimum, maximum, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, norm, clamp, rescale, sigmoid, logit, smoothstep, rounder, random, uniform, normal, cumsum, e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, bold
]
const KEYS = VALS.map(g => g.name).map(g => g.replace(/\$\d+$/g, ''))

//
// exports
//

export {
    ELEMS, KEYS, VALS, Context, Element, Debug, Group, Svg, Box, Frame, Stack, HWrap, VStack, HStack, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Polyline, Polygon, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, Arc, Triangle, Arrow, Field, TextSpan, Text, Markdown, TextBox, TextFrame, TextStack, TextFlex, Latex, Equation, TitleFrame, ArrowHead, ArrowPath, Node, TextNode, Edge, Network, SymPoints, SymLine, SymPoly, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Graph, Plot, BarPlot, Legend, Slide, Image, range, linspace, enumerate, repeat, meshgrid, lingrid, hexToRgba, interp, palette, gzip, zip, reshape, split, concat, sum, prod, exp, log, sin, cos, tan, min, max, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, norm, clamp, rescale, sigmoid, logit, smoothstep, rounder, random, uniform, normal, cumsum, e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, bold, is_string, is_array, is_object, is_function, is_element, is_scalar, setTheme
}
