// core utils

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
    return arr.reduce((a, b) => a && b)
}

function any(arr) {
    return arr.reduce((a, b) => a || b)
}

// vector ops

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

function range(ia, ib, step) {
    step = step ?? 1
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

function compress_whitespace(text) {
    return text.replace(/\s+/g, ' ').trimStart()
}

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
    const [ lo, hi ] = lim ?? D.lim
    return maximum(lo, minimum(x, hi))
}

function rescale(x, lim) {
    const [ lo, hi ] = lim ?? D.lim
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
// export
//

export { is_browser, is_scalar, is_string, is_number, is_object, is_function, is_array, ensure_array, ensure_vector, ensure_singleton, ensure_function, gzip, zip, reshape, split, concat, squeeze, intersperse, sum, prod, mean, all, any, add, sub, mul, div, cumsum, norm, normalize, range, linspace, enumerate, repeat, padvec, meshgrid, lingrid, map_object, filter_object, compress_whitespace, exp, log, sin, cos, tan, cot, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, isNan, isInf, minimum, maximum, heavisign, abs_min, abs_max, min, max, clamp, rescale, sigmoid, logit, smoothstep, identity, invert, random, uniform, normal }
