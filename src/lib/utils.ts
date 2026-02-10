// core utils

import { DEFAULTS as D, d2r, r2d, pi } from './const.js'
import type { Point, Rect, Limit, RGBA, MNumber, MPoint, Direc, Orient } from './types.js'

//
// environment tests
//

function is_browser(): boolean {
    return typeof window != 'undefined'
}

//
// type tests
//

function is_boolean(x: any): x is boolean {
    return typeof(x) == 'boolean'
}

function is_scalar(x: any): x is number {
    return typeof(x) == 'number'
}

function is_point(x: any): x is Point {
    return is_array(x) && x.length == 2
}

function is_rect(x: any): x is Rect {
    return is_array(x) && x.length == 4
}

function is_string(x: any): x is string {
    return typeof(x) == 'string'
}

function is_number(x: any): x is number {
    return typeof(x) == 'number'
}

function is_object(x: any): boolean {
    return typeof(x) == 'object'
}

function is_function(x: any): x is Function {
    return typeof(x) == 'function'
}

function is_array(x: any): x is any[] {
    return Array.isArray(x)
}

//
// type conversions
//

function ensure_array(x: any, empty: boolean = true): any[] {
    x = is_array(x) ? x : [ x ]
    x = x.filter((v: any) => v != null)
    if (!empty && x.length == 0) {
        throw new Error('Array must have at least one element')
    }
    return x
}

function ensure_vector(x: any, n: number): any[] {
    if (!is_array(x)) {
        return range(n).map(i => x)
    } else {
        return x
    }
}

function ensure_singleton(x: any): any {
    return is_array(x) ? x[0] : x
}

function ensure_function(x: any): any | undefined {
    if (x == null) return
    if (is_function(x)) {
        return x
    } else {
        return () => x
    }
}

//
// type checks
//

function check_singleton(children: any): any {
    if (children == null || children.length == 0) return null
    if (is_array(children) && children.length > 1) {
        throw new Error('Must have exactly one child')
    }
    return ensure_singleton(children)
}

function check_string(children: any): string {
    const child = check_singleton(children)
    if (child == null) return ''
    if (is_scalar(child)) return child.toString()
    if (!is_string(child)) throw new Error('Child must be a string')
    return child
}

//
// array utils
//

function* gzip(...iterables: Iterable<any>[]): Generator<any[]> {
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

function zip(...iterables: Iterable<any>[]): any[][] {
    return [...gzip(...iterables)]
}

function reshape(arr: any[], shape: [number, number]): any[][] {
    const [n, m] = shape
    const ret: any[][] = []
    for (let i = 0; i < n; i++) {
        ret.push(arr.slice(i*m, (i+1)*m))
    }
    return ret
}

function split(arr: any[], len: number): any[][] {
    const n = Math.ceil(arr.length / len)
    return reshape(arr, [n, len])
}

function concat(arrs: any[][]): any[] {
    return arrs.flat()
}

function squeeze(x: any): any {
    return is_array(x) && x.length == 1 ? x[0] : x
}

function slice(arr: any[], i0: number, i1: number, step: number = 1): any[] {
    const idx = range(i0, i1, step)
    return arr.filter((_, i) => idx.includes(i))
}

function intersperse(items: any[], spacer: any): any[] {
    return items.flatMap((item, i) => i > 0 ? [ spacer, item ] : [ item ])
}

//
// array reducers
//

function sum(arr: any[]): number {
    arr = arr.filter(v => v != null)
    return arr.reduce((a: number, b: number) => a + b, 0)
}

function prod(arr: any[]): number {
    arr = arr.filter(v => v != null)
    return arr.reduce((a: number, b: number) => a * b, 1)
}

function mean(arr: number[]): number {
    return sum(arr) / arr.length
}

function all(arr: any[]): boolean {
    return arr.reduce((a, b) => a && b, true)
}

function any(arr: any[]): boolean {
    return arr.reduce((a, b) => a || b, false)
}

//
// vector ops
//

function broadcast_tuple(x: any, y: any): [any, any] {
    const xa = is_array(x)
    const ya = is_array(y)
    if (xa == ya) return [ x, y ]
    if (!xa) x = [ x, x, x, x ]
    if (!ya) y = [ y, y, y, y ]
    return [ x, y ]
}

function broadcastFunc(f: (a: number, b: number) => number): (x: any, y: any) => any {
    return (x0, y0) => {
        const [ x, y] = broadcast_tuple(x0, y0)
        if (is_scalar(x) && is_scalar(y)) return f(x, y)
        else return zip(x, y).map(([ a, b ]) => f(a, b))
    }
}

function add(x: any, y: any): any {
    return broadcastFunc((a, b) => a + b)(x, y)
}
function sub(x: any, y: any): any {
    return broadcastFunc((a, b) => a - b)(x, y)
}
function mul(x: any, y: any): any {
    return broadcastFunc((a, b) => a * b)(x, y)
}
function div(x: any, y: any): any {
    return broadcastFunc((a, b) => a / b)(x, y)
}

//
// array ops
//

function cumsum(arr: number[], first: boolean = true): number[] {
    let sum = 0
    const ret = arr.map(x => sum += x)
    return first ? [ 0, ...ret ] : ret
}

function norm(vals: number[], degree: number = 2): number {
    return sum(vals.map(v => v**degree))**(1 / degree)
}

function normalize(vals: number[], degree: number = 1): number[] {
    const mag = norm(vals, degree)
    return (mag == 0) ? vals.map(v => 0) : vals.map(v => v / mag)
}

//
// array generators
//

function range(ia: number, ib?: number, step: number = 1): number[] {
    const [ i0, i1 ] = (ib == null) ? [ 0, ia ] : [ ia, ib ]
    const n = floor((i1 - i0) / step)
    return [...Array(n).keys()].map(i => i0 + step * i)
}

function linspace(x0: number, x1: number, n: number): number[] {
    if (n == 1) { return [ 0.5 * (x0 + x1) ] }
    const step = (x1 - x0) / (n - 1)
    return [...Array(n).keys()].map(i => x0 + step * i)
}

function enumerate(x: any[]): any[][] {
    const n = x.length
    const idx = range(n)
    return zip(idx, x)
}

function repeat<T>(x: T, n: number): T[] {
    return Array(n).fill(x)
}

function padvec(vec: any[], len: number, val: any): any[] {
    if (vec.length >= len) return vec
    const m = len - vec.length
    return [...vec, ...repeat(val, m)]
}

//
// array combinators
//

function meshgrid<T, U>(x: T[], y: U[]): [T, U][] {
    return x.flatMap(xi => y.map(yi => [ xi, yi ] as [T, U]))
}

function lingrid(xlim: Limit, ylim: Limit, N: number | Point): Point[] {
    const [Nx, Ny] = ensure_vector(N, 2)
    const xgrid = linspace(...xlim, Nx)
    const ygrid = linspace(...ylim, Ny)
    return meshgrid(xgrid, ygrid)
}

//
// object utils
//

function map_object(obj: Record<string, any>, fn: (k: string, v: any) => any): Record<string, any> {
    return Object.fromEntries(
        Object.entries(obj).map(([ k, v ]) => [ k, fn(k, v) ])
    )
}

function filter_object(obj: Record<string, any>, fn: (k: string, v: any) => boolean): Record<string, any> {
    return Object.fromEntries(
        Object.entries(obj).filter(([ k, v ]) => fn(k, v))
    )
}

//
// string utils
//

function rounder(x: any, prec?: number): string {
    prec = prec ?? D.prec

    let suf: string
    if (is_string(x) && x.endsWith('px')) {
        x = Number(x.slice(0, -2))
        suf = 'px'
    } else {
        suf = ''
    }

    let ret: any
    if (is_scalar(x)) {
        ret = x.toFixed(prec)
        ret = ret.replace(/(\.[0-9]*?)0+$/, '$1').replace(/\.$/, '')
    } else {
        ret = x
    }

    return ret + suf
}

function compress_whitespace(text: string): string {
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
const cot = (x: number): number => 1 / tan(x)
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
const isInf = (x: number): boolean => !Number.isFinite(x)

// follows numpy naming conventions
const minimum = Math.min
const maximum = Math.max

function heavisign(x: number): number {
    return x >= 0 ? 1 : -1
}

function abs_min(x: number, y: number): number {
    return abs(x) < abs(y) ? x : y
}

function abs_max(x: number, y: number): number {
    return abs(x) > abs(y) ? x : y
}

// null on empty
function min(vals: any[]): number | undefined {
    vals = vals.filter(v => v != null)
    return (vals.length > 0) ? Math.min(...vals) : undefined
}
function max(vals: any[]): number | undefined {
    vals = vals.filter(v => v != null)
    return (vals.length > 0) ? Math.max(...vals) : undefined
}

function clamp(x: number, lim: Limit): number {
    const [ lo, hi ] = lim
    return maximum(lo, minimum(x, hi))
}

function rescale(x: number, lim: Limit): number {
    const [ lo, hi ] = lim
    return (x - lo) / (hi - lo)
}

function sigmoid(x: number): number {
    return 1 / (1 + exp(-x))
}

function logit(p: number): number {
    return log(p / (1 - p))
}

function smoothstep(x: number, lim?: Limit): number {
    const [ lo, hi ] = lim ?? [ 0, 1 ]
    const t = clamp((x - lo) / (hi - lo), [ 0, 1 ])
    return t * t * (3 - 2 * t)
}

function identity(x: any): any {
    return x
}

function invert(x: number | undefined): number | undefined {
    return x != null ? 1 / x : undefined
}

//
// random number generation
//

const random = Math.random

function uniform(lo: number, hi: number): number {
    return lo + (hi - lo)*random()
}

// standard normal using Box-Muller transform
function normal(mean?: number, stdv?: number): Point {
    mean = mean ?? 0
    stdv = stdv ?? 1
    const [ u, v ] = [ 1 - random(), random() ]
    const [ r, t ] = [ sqrt(-2 * log(u)), 2 * pi * v ]
    const [ a, b ] = [ r * cos(t), r * sin(t) ]
    return [ a, b ].map(x => mean + stdv * x) as Point
}

//
// metaposition arithmetic
//

function ensure_point(p: Point | number): Point {
    return is_scalar(p) ? [p as number, p as number] : p as Point
}

function ensure_mnumber(p: MNumber | number): MNumber {
    return is_scalar(p) ? [ p as number, 0 ] : p as [number, number]
}

function ensure_mpoint(p: [MNumber | number, MNumber | number]): MPoint {
    const [ p0, p1 ] = p
    return [ ensure_mnumber(p0), ensure_mnumber(p1) ]
}

function squeeze_mnumber(p: MNumber): number {
    const [ x, _ ] = p
    return x
}

function squeeze_mpoint(p: MPoint): Point {
    const [ x, y ] = p
    return [ squeeze_mnumber(x), squeeze_mnumber(y) ]
}

function add_mnumber(p0: MNumber | number, p1: MNumber | number): MNumber {
    const [ x0, c0 ] = ensure_mnumber(p0)
    const [ x1, c1 ] = ensure_mnumber(p1)
    return [ x0 + x1, c0 + c1 ]
}

function sub_mnumber(p0: MNumber | number, p1: MNumber | number): MNumber {
    const [ x0, c0 ] = ensure_mnumber(p0)
    const [ x1, c1 ] = ensure_mnumber(p1)
    return [ x0 - x1, c0 - c1 ]
}

function add_mpoint(p0: MPoint | Point, p1: MPoint | Point): MPoint {
    const [ x0, y0 ] = ensure_mpoint(p0)
    const [ x1, y1 ] = ensure_mpoint(p1)
    return [ add_mnumber(x0, x1), add_mnumber(y0, y1) ]
}

function sub_mpoint(p0: MPoint | Point, p1: MPoint | Point): MPoint {
    const [ x0, y0 ] = ensure_mpoint(p0)
    const [ x1, y1 ] = ensure_mpoint(p1)
    return [ sub_mnumber(x0, x1), sub_mnumber(y0, y1) ]
}

//
// rect stats
//

function rect_size(rect: Rect): Point {
    const [ x1, y1, x2, y2 ] = rect
    return [ x2 - x1, y2 - y1 ]
}

function rect_dims(rect: Rect): Point {
    const [ w, h ] = rect_size(rect)
    return [ abs(w), abs(h) ]
}

function rect_center(rect: Rect): Point {
    const [ x1, y1, x2, y2 ] = rect
    return [ (x1 + x2) / 2, (y1 + y2) / 2 ]
}

function rect_radius(rect: Rect): Point {
    const [ w, h ] = rect_size(rect)
    return [ w / 2, h / 2 ]
}

function rect_aspect(rect: Rect | undefined): number | undefined {
    if (rect == null) return
    const [ w, h ] = rect_dims(rect)
    return w / h
}

//
// rect formats
//

// radial rect: center, radius
function rect_radial(rect: Rect, absolute: boolean = false): Rect {
    const [ cx, cy ] = rect_center(rect)
    const [ rx0, ry0 ] = rect_radius(rect)
    const [ rx, ry ] = absolute ? [ abs(rx0), abs(ry0) ] : [ rx0, ry0 ]
    return [ cx, cy, rx, ry ]
}

// TODO: add optimized path for Point/number case
function radial_rect(p0: Point | MPoint, r0: number | Point): Rect {
    const p = ensure_mpoint(p0)
    const r = ensure_point(r0)
    const pa = sub_mpoint(p, r)
    const pb = add_mpoint(p, r)
    return [ ...squeeze_mpoint(pa), ...squeeze_mpoint(pb) ]
}

// box rect: min, size
function rect_box(rect: Rect, absolute: boolean = false): Rect {
    const [ x1, y1, x2, y2 ] = rect
    const [ w, h ] = [ x2 - x1, y2 - y1 ]
    if (absolute) {
        return [ minimum(x1, x2), minimum(y1, y2), abs(w), abs(h) ]
    } else {
        return [ x1, y1, w, h ]
    }
}

function box_rect(box: Rect): Rect {
    const [ x, y, w, h ] = box
    return [ x, y, x + w, y + h ]
}

// center box rect: center, size
function rect_cbox(rect: Rect): Rect {
    const [ cx, cy ] = rect_center(rect)
    const [ w, h ] = rect_size(rect)
    return [ cx, cy, w, h ]
}

function cbox_rect(cbox: Rect): Rect {
    const [ cx, cy, w, h ] = cbox
    const [ rx, ry ] = [ w / 2, h / 2 ]
    return [ cx - rx, cy - ry, cx + rx, cy + ry ]
}

//
// rect aggregators
//

function merge_rects(rects: (Rect | undefined)[] | undefined): Rect | undefined {
    if (rects == null || rects.length == 0) return
    const rects1 = rects.filter(r => r != null) as Rect[]
    if (rects1.length == 0) return
    const [ xa, ya, xb, yb ] = zip(...rects1)
    const [ xs, ys ] = [ [ ...xa, ...xb ], [ ...ya, ...yb ] ]
    return [ min(xs), min(ys), max(xs), max(ys) ] as Rect
}

function merge_points(points: Point[] | undefined): Rect | undefined {
    if (points == null || points.length == 0) return
    const [ xs, ys ] = zip(...points)
    return [ min(xs), min(ys), max(xs), max(ys) ] as Rect
}

function merge_values(vals: number[] | undefined): Limit | undefined {
    if (vals == null || vals.length == 0) return
    return [ min(vals), max(vals) ] as Limit
}

//
// rect transformers
//

function expand_limits(lim: Limit | undefined, fact: number): Limit | undefined {
    if (lim == null) return
    const [ lo, hi ] = lim
    const ex = fact * (hi - lo)
    return [ lo - ex, hi + ex ]
}

function expand_rect(rect: Rect | undefined, expand: any): Rect | undefined {
    if (rect == null) return
    const [ xexp, yexp ] = ensure_vector(expand, 2)
    const [ x1, y1, x2, y2 ] = rect
    return [ x1 - xexp, y1 - yexp, x2 + xexp, y2 + yexp ]
}

function flip_rect(rect: Rect | undefined, vertical: boolean): Rect {
    const [ x1, y1, x2, y2 ] = rect ?? D.rect
    if (vertical) return [ x1, y2, x2, y1 ]
    else return [ x2, y1, x1, y2 ]
}

function upright_rect(rect: Rect | undefined): Rect | undefined {
    if (rect == null) return
    const [ x1, y1, x2, y2 ] = rect
    return [
        minimum(x1, x2), minimum(y1, y2),
        maximum(x1, x2), maximum(y1, y2),
    ]
}

//
// limit utils
//

function join_limits({ v, h }: { v?: Limit, h?: Limit } = {}): Rect {
    const [ vlo, vhi ] = v ?? D.lim
    const [ hlo, hhi ] = h ?? D.lim
    return [ hlo, vlo, hhi, vhi ]
}

function split_limits(coord: Rect | undefined): { xlim?: Limit, ylim?: Limit } {
    if (coord == null) return {}
    const [ xlo, ylo, xhi, yhi ] = coord
    return { xlim: [ xlo, xhi ], ylim: [ ylo, yhi ] }
}

function resolve_limits(xlim: Limit | undefined, ylim: Limit | undefined, coord: Rect | undefined): { xlim: Limit, ylim: Limit } {
    const { xlim: xlim0, ylim: ylim0 } = split_limits(coord)
    return { xlim: xlim ?? xlim0!, ylim: ylim ?? ylim0! }
}

function detect_coords(xvals: number[], yvals: number[], xlim: Limit | undefined, ylim: Limit | undefined): Rect {
    return join_limits({
        h: xlim ?? merge_values(xvals) ?? undefined,
        v: ylim ?? merge_values(yvals) ?? undefined,
    })
}

function invert_orient(direc: Orient): Orient {
    return direc == 'v' ? 'h' :
           direc == 'h' ? 'v' :
           direc
}

//
// aspect utils
//

function aspect_invariant(value0: number | Point | Rect, aspect0: number | undefined, alpha: number = 0.5): Point | Rect {
    const aspect = aspect0 ?? 1
    const wfact = aspect**alpha
    const hfact = aspect**(1 - alpha)

    const value = is_scalar(value0) ? [ value0, value0 ] as Point : value0 as Rect

    if (is_point(value)) {
        const [ vw, vh ] = value
        return [ vw * wfact, vh / hfact ]
    } else if (is_rect(value)) {
        const [ vl, vt, vr, vb ] = value
        return [ vl * wfact, vt / hfact, vr * wfact, vb / hfact ]
    } else {
        throw new Error(`Invalid value: ${value}`)
    }
}

// get the aspect of a rect of given `aspect` after rotating it by `rotate` degrees
function rotate_aspect(aspect: number | undefined, rotate: number | undefined): number | undefined {
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

function remap_rect(rect: Rect, coord_in: Rect, coord_out: Rect): Rect {
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

function rescaler(lim_in: Limit, lim_out: Limit): (x0: any, offset?: boolean) => number {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    return (x0: any, offset: boolean = true) => {
        const [ x, c ] = is_array(x0) ? x0 : [ x0, 0 ]
        const f = (x - in_lo) / in_len
        const x1 = out_lo + f * out_len
        return offset ? x1 + c : x1
    }
}

function resizer(lim_in: Limit, lim_out: Limit): (x0: any, offset?: boolean) => number {
    const [ in_lo, in_hi ] = lim_in
    const [ out_lo, out_hi ] = lim_out
    const [ in_len, out_len ] = [ in_hi - in_lo, out_hi - out_lo ]
    const ratio = out_len / in_len
    return (x0: any, offset: boolean = true) => {
        const [ x, c ] = is_array(x0) ? x0 : [ x0, 0 ]
        const x1 = x * ratio
        return offset ? x1 + c : x1
    }
}

//
// angle and direction utils
//

function norm_angle(deg: number): number {
    if (deg == 360) return 359.99
    deg = deg % 360
    return deg < 0 ? deg + 360 : deg
}

function vector_angle(vector: Point): number {
    const [ x, y ] = vector
    return r2d * Math.atan2(y, x)
}

function cardinal_direc(direc: string): Point | undefined {
    return (direc == 'n') ? [ 0, -1] :
           (direc == 'e') ? [ 1, 0 ] :
           (direc == 'w') ? [-1, 0 ] :
           (direc == 's') ? [ 0, 1 ] :
           undefined
}

function angel_vector(angle: number): Point {
    return [ cos(d2r * angle), sin(d2r * angle) ]
}

function unit_direc(direc: Direc | undefined): Point | undefined {
    if (direc == null) return
    if (is_string(direc)) return cardinal_direc(direc)
    if (is_scalar(direc)) return angel_vector(direc as number)
    if (is_array(direc) && direc.length == 2) return normalize(direc, 2) as Point
    throw new Error(`Invalid direction: ${direc}`)
}

//
// color handling
//

function hexToRgba(hex: string): RGBA {
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

function rgba_repr(rgba: RGBA, prec: number = D.prec): string {
    const [ r, g, b, a ] = rgba
    return `rgba(${rounder(r, prec)}, ${rounder(g, prec)}, ${rounder(b, prec)}, ${rounder(a, prec)})`
}

function interp(start0: string, stop0: string, x: number): string {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const slope = sub(stop, start)
    const color = add(start, mul(slope, x))
    return rgba_repr(color)
}

function palette(start0: string, stop0: string, clim: Limit = D.lim): (x: number) => string {
    const start = hexToRgba(start0)
    const stop = hexToRgba(stop0)
    const slope = sub(stop, start)
    const scale = rescaler(clim, D.lim)
    function gradient(x: number): string {
        const x1 = scale(x)
        const c = add(start, mul(slope, x1))
        return rgba_repr(c)
    }
    return gradient
}

//
// export
//

export { is_browser, is_boolean, is_scalar, is_string, is_number, is_object, is_function, is_array, ensure_array, ensure_vector, ensure_singleton, ensure_function, check_singleton, check_string, gzip, zip, reshape, split, concat, squeeze, slice, intersperse, sum, prod, mean, all, any, add, sub, mul, div, cumsum, norm, normalize, range, linspace, enumerate, repeat, padvec, meshgrid, lingrid, map_object, filter_object, compress_whitespace, exp, log, sin, cos, tan, cot, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, isNan, isInf, minimum, maximum, heavisign, abs_min, abs_max, min, max, clamp, rescale, sigmoid, logit, smoothstep, identity, invert, random, uniform, normal, ensure_point, ensure_mnumber, add_mnumber, sub_mnumber, ensure_mpoint, add_mpoint, sub_mpoint, squeeze_mnumber, squeeze_mpoint, rect_size, rect_dims, rect_center, rect_radius, rect_aspect, rect_radial, norm_angle, split_limits, vector_angle, cardinal_direc, unit_direc, rgba_repr, interp, palette, detect_coords, resolve_limits, join_limits, invert_orient, aspect_invariant, flip_rect, radial_rect, box_rect, rect_box, cbox_rect, rect_cbox, merge_rects, merge_points, merge_values, expand_limits, expand_rect, upright_rect, rounder, remap_rect, resizer, rescaler, rotate_aspect }
