// core utils

//
// type tests
//

function is_scalar(x) {
    return (
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

//
// export
//

export { is_scalar, is_string, is_number, is_object, is_function, is_array, gzip, zip, reshape, split, concat, squeeze, intersperse, sum, prod, mean, all, any, add, sub, mul, div, map_object, filter_object, compress_whitespace }
