// core utils

import { DEFAULTS as D, d2r, r2d } from './const.js'

//
// environment tests
//

function is_browser() {
    return typeof window != 'undefined'
}

//
// type tests
//

function is_scalar(x) {
    return (
        (x == null) ||
        (typeof(x) == 'number') ||
        (typeof(x) == 'object' && (
            (x.constructor.name == 'Number') ||
            (x.constructor.name == 'NamedNumber')
        ))
    )
}

function is_string(x) {
    return typeof(x) == 'string'
}

function is_number(x) {
    return typeof(x) == 'number'
}

function is_object(x) {
    return typeof(x) == 'object'
}

function is_function(x) {
    return typeof(x) == 'function'
}

function is_array(x) {
    return Array.isArray(x)
}

//
// type conversions
//

function ensure_array(x, empty = true) {
    x = is_array(x) ? x : [ x ]
    x = x.filter(v => v != null)
    if (!empty && x.length == 0) {
        throw new Error('Array must have at least one element')
    }
    return x
}

function ensure_vector(x, n) {
    if (!is_array(x)) {
        return range(n).map(i => x)
    } else {
        return x
    }
}

function ensure_singleton(x) {
    return is_array(x) ? x[0] : x
}

function ensure_function(x) {
    if (x == null) return null
    if (is_function(x)) {
        return x
    } else {
        return () => x
    }
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
    if (is_scalar(child)) return child.toString()
    if (!is_string(child)) throw new Error('Child must be a string')
    return child
}

//
// array utils
//

function* gzip(...iterables) {
    if (iterables.length == 0) {
        return
    }
    const iterators = iterables.map(i => i[Symbol.iterator]())
    while (true) {
        const results = iterators.map(iter => iter.next())
        if (results.some(res => res.done)) {
            return
        } else {
            yield results.map(res => res.value)
        }
    }
}

function zip(...iterables) {
    return [...gzip(...iterables)]
}

function reshape(arr, shape) {
    const [n, m] = shape
    const ret = []
    for (let i = 0; i < n; i++) {
        ret.push(arr.slice(i*m, (i+1)*m))
    }
    return ret
}

function split(arr, len) {
    const n = Math.ceil(arr.length / len)
    return reshape(arr, [n, len])
}

function concat(arrs) {
    return arrs.flat()
}

function squeeze(x) {
    return is_array(x) && x.length == 1 ? x[0] : x
}

function slice(arr, i0, i1, step=1) {
    const idx = range(i0, i1, step)
    return arr.filter((_, i) => idx.includes(i))
}

function intersperse(items, spacer) {
    return items.flatMap((item, i) => i > 0 ? [ spacer, item ] : [ item ])
}

//
// array reducers
//

function sum(arr) {
    arr = arr.filter(v => v != null)
    return arr.reduce((a, b) => a + b, 0)
}

function prod(arr) {
    arr = arr.filter(v => v != null)
    return arr.reduce((a, b) => a * b, 1)
}

function mean(arr) {
    return sum(arr) / arr.length
}

function all(arr) {
    return arr.reduce((a, b) => a && b, true)
}

function any(arr) {
    return arr.reduce((a, b) => a || b, false)
}

//
// vector ops
//

function broadcast_tuple(x, y) {
    const xa = is_array(x)
    const ya = is_array(y)
    if (xa == ya) return [ x, y ]
    if (!xa) x = [ x, x, x, x ]
    if (!ya) y = [ y, y, y, y ]
    return [ x, y ]
}

function broadcastFunc(f) {
    return (x0, y0) => {
        const [ x, y] = broadcast_tuple(x0, y0)
        if (is_scalar(x) && is_scalar(y)) return f(x, y)
        else return zip(x, y).map(([ a, b ]) => f(a, b))
    }
}

function add(x, y) {
    return broadcastFunc((a, b) => a + b)(x, y)
}
function sub(x, y) {
    return broadcastFunc((a, b) => a - b)(x, y)
}
function mul(x, y) {
    return broadcastFunc((a, b) => a * b)(x, y)
}
function div(x, y) {
    return broadcastFunc((a, b) => a / b)(x, y)
}

//
// array ops
//

function cumsum(arr, first=true) {
    let sum = 0
    const ret = arr.map(x => sum += x)
    return first ? [ 0, ...ret ] : ret
}

function norm(vals, degree=2) {
    return sum(vals.map(v => v**degree))**(1 / degree)
}

function normalize(vals, degree=1) {
    const mag = norm(vals, degree)
    return (mag == 0) ? vals.map(v => 0) : vals.map(v => v / mag)
}

//
// array generators
//

function range(ia, ib, step=1) {
    const [ i0, i1 ] = (ib == null) ? [ 0, ia ] : [ ia, ib ]
    const n = floor((i1 - i0) / step)
    return [...Array(n).keys()].map(i => i0 + step * i)
}

function linspace(x0, x1, n) {
    if (n == 1) { return [ 0.5 * (x0 + x1) ] }
    const step = (x1 - x0) / (n - 1)
    return [...Array(n).keys()].map(i => x0 + step * i)
}

function enumerate(x) {
    const n = x.length
    const idx = range(n)
    return zip(idx, x)
}

function repeat(x, n) {
    return Array(n).fill(x)
}

function padvec(vec, len, val) {
    if (vec.length >= len) return vec
    const m = len - vec.length
    return [...vec, ...repeat(val, m)]
}

//
// array combinators
//

function meshgrid(x, y) {
    return x.flatMap(xi => y.map(yi => [ xi, yi ]))
}

function lingrid(xlim, ylim, N) {
    if (N >= 100) throw new Error('N is restricted to be less than 100')
    const [Nx, Ny] = ensure_vector(N, 2)
    const xgrid = linspace(...xlim, Nx)
    const ygrid = linspace(...ylim, Ny)
    return meshgrid(xgrid, ygrid)
}

//
// object utils
//

function map_object(obj, fn) {
    return Object.fromEntries(
        Object.entries(obj).map(([ k, v ]) => [ k, fn(k, v) ])
    )
}

function filter_object(obj, fn) {
    return Object.fromEntries(
        Object.entries(obj).filter(([ k, v ]) => fn(k, v))
    )
}

//
// string utils
//

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

function compress_whitespace(text) {
    return text.replace(/\s+/g, ' ').trimStart()
}

//
// math functions
//

// functions
const exp = Math.exp
const log = Math.log
const sin = Math.sin
const cos = Math.cos
const tan = Math.tan
const cot = x => 1 / tan(x)
const abs = Math.abs
const pow = Math.pow
const sqrt = Math.sqrt
const sign = Math.sign
const floor = Math.floor
const ceil = Math.ceil
const round = Math.round
const atan = Math.atan
const atan2 = Math.atan2
const isNan = Number.isNaN
const isInf = x => !Number.isFinite(x)

// follows numpy naming conventions
const minimum = Math.min
const maximum = Math.max

function heavisign(x) {
    return x >= 0 ? 1 : -1
}

function abs_min(x, y) {
    return abs(x) < abs(y) ? x : y
}

function abs_max(x, y) {
    return abs(x) > abs(y) ? x : y
}

// null on empty
function min(vals) {
    vals = vals.filter(v => v != null)
    return (vals.length > 0) ? Math.min(...vals) : null
}
function max(vals) {
    vals = vals.filter(v => v != null)
    return (vals.length > 0) ? Math.max(...vals) : null
}

function clamp(x, lim) {
    const [ lo, hi ] = lim
    return maximum(lo, minimum(x, hi))
}

function rescale(x, lim) {
    const [ lo, hi ] = lim
    return (x - lo) / (hi - lo)
}

function sigmoid(x) {
    return 1 / (1 + exp(-x))
}

function logit(p) {
    return log(p / (1 - p))
}

function smoothstep(x, lim) {
    const [ lo, hi ] = lim ?? [ 0, 1 ]
    const t = clamp((x - lo) / (hi - lo), [ 0, 1 ])
    return t * t * (3 - 2 * t)
}

function identity(x) {
    return x
}

function invert(x) {
    return x != null ? 1 / x : null
}

//
// random number generation
//

const random = Math.random

function uniform(lo, hi) {
    return lo + (hi - lo)*random()
}

// standard normal using Box-Muller transform
function normal(mean, stdv) {
    mean = mean ?? 0
    stdv = stdv ?? 1
    const [ u, v ] = [ 1 - random(), random() ]
    const [ r, t ] = [ sqrt(-2 * log(u)), 2 * pi * v ]
    const [ a, b ] = [ r * cos(t), r * sin(t) ]
    return [ a, b ].map(x => mean + stdv * x)
}

//
// metaposition arithmetic
//

function ensure_mloc(p) {
    return is_scalar(p) ? [ p, 0 ] : p
}

function add_mloc(p0, p1, trim = false) {
    const [ x0, c0 ] = ensure_mloc(p0)
    const [ x1, c1 ] = ensure_mloc(p1)
    const [ x, c ] = [ x0 + x1, c0 + c1 ]
    return (c == 0 || trim) ? x : [ x, c ]
}

function sub_mloc(p0, p1, trim = false) {
    const [ x0, c0 ] = ensure_mloc(p0)
    const [ x1, c1 ] = ensure_mloc(p1)
    const [ x, c ] = [ x0 - x1, c0 - c1 ]
    return (c == 0 || trim) ? x : [ x, c ]
}

function ensure_mpos(p) {
    return p.map(ensure_mloc)
}

function add_mpos(p0, p1, trim = false) {
    const [ x0, y0 ] = p0
    const [ x1, y1 ] = p1
    return [
        add_mloc(x0, x1, trim),
        add_mloc(y0, y1, trim),
    ]
}

function sub_mpos(p0, p1, trim = false) {
    const [ x0, y0 ] = p0
    const [ x1, y1 ] = p1
    return [
        sub_mloc(x0, x1, trim),
        sub_mloc(y0, y1, trim),
    ]
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

function radial_rect(p, r0) {
    const r = ensure_vector(r0, 2)
    const p0 = sub_mpos(p, r)
    const p1 = add_mpos(p, r)
    return [ ...p0, ...p1 ]
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

//
// rect mappers
//

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

function rgba_repr(rgba, prec = D.prec) {
    const [ r, g, b, a ] = rgba
    return `rgba(${rounder(r, prec)}, ${rounder(g, prec)}, ${rounder(b, prec)}, ${rounder(a, prec)})`
}

function interp(start0, stop0, x) {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const slope = sub(stop, start)
    const color = add(start, mul(slope, x))
    return rgba_repr(color)
}

function palette(start0, stop0, clim = D.lim) {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const slope = sub(stop, start)
    const scale = rescaler(clim, D.lim)
    function gradient(x) {
        const x1 = scale(x)
        const c = add(start, mul(slope, x1))
        return rgba_repr(c)
    }
    return gradient
}

//
// export
//

export { is_browser, is_scalar, is_string, is_number, is_object, is_function, is_array, ensure_array, ensure_vector, ensure_singleton, ensure_function, check_singleton, check_string, gzip, zip, reshape, split, concat, squeeze, slice, intersperse, sum, prod, mean, all, any, add, sub, mul, div, cumsum, norm, normalize, range, linspace, enumerate, repeat, padvec, meshgrid, lingrid, map_object, filter_object, compress_whitespace, exp, log, sin, cos, tan, cot, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, isNan, isInf, minimum, maximum, heavisign, abs_min, abs_max, min, max, clamp, rescale, sigmoid, logit, smoothstep, identity, invert, random, uniform, normal, ensure_mloc, add_mloc, sub_mloc, ensure_mpos, add_mpos, sub_mpos, rect_size, rect_dims, rect_center, rect_radius, rect_aspect, rect_radial, norm_angle, split_limits, vector_angle, cardinal_direc, unit_direc, rgba_repr, interp, palette, detect_coords, resolve_limits, join_limits, invert_direc, aspect_invariant, flip_rect, radial_rect, box_rect, rect_box, cbox_rect, rect_cbox, merge_rects, merge_points, merge_values, expand_limits, expand_rect, upright_rect, rounder, remap_rect, resizer, rescaler, rotate_aspect }
