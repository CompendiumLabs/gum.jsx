//
// utility
//

//
// constants
//

const DEFAULT_SIZE = 500
const DEFAULT_RECT = [ 0, 0, 1, 1 ]
const DEFAULT_COORDS = [ 0, 0, 1, 1 ]
const DEFAULT_LIM = [ 0, 1 ]
const DEFAULT_N = 100
const DEFAULT_PROP = {
  stroke: 'black',
  fill: 'none',
}

//
// colors
//

const red = '#ff0d57'
const green = '#4caf50'
const blue = '#1e88e5'

//
// type funcs
//

function isNumber(x) {
  return typeof x === 'number'
}

function isArray(x) {
  return Array.isArray(x)
}

function isString(x) {
  return typeof x === 'string'
}

function isObject(x) {
  return typeof x === 'object'
}

function isFunction(x) {
  return typeof x === 'function'
}

//
// math funcs
//

function max(...arr) {
  return Math.max(...arr)
}

function min(...arr) {
  return Math.min(...arr)
}

function any(arr) {
  return arr.some(x => x)
}

function all(arr) {
  return arr.every(x => x)
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0)
}

function cumsum(arr) {
  return arr.reduce((a, b) => [...a, a[a.length - 1] + b], [0])
}

//
// array tools
//

function* gzip(...iterables) {
  if (iterables.length == 0) return
  let iterators = iterables.map(i => i[Symbol.iterator]())
  while (true) {
      let results = iterators.map(iter => iter.next())
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

function natty(n) {
  return [...Array(n).keys()]
}

function range(i0, i1, step = 1) {
  [i0, i1] = (i1 === undefined) ? [0, i0] : [i0, i1]
  let n = Math.floor((i1-i0)/step)
  return natty(n).map(i => i0 + step*i)
}

function linspace(x0, x1, n) {
  if (n == 0) return []
  if (n == 1) return [0.5*(x0+x1)]
  let step = (x1-x0)/(n-1)
  return natty(n).map(i => x0 + step*i)
}

//
// rect tools
//

function rectSize(rect) {
  const [ x1, y1, x2, y2 ] = rect
  return [ x2 - x1, y2 - y1 ]
}

function rectAspect(rect) {
  const [ x1, y1, x2, y2 ] = rect
  return (x2 - x1) / (y2 - y1)
}

function rectCenter(rect) {
  const [ x1, y1, x2, y2 ] = rect
  return [ (x1 + x2) / 2, (y1 + y2) / 2 ]
}

function rectBox(rect) {
  const [ x, y ] = rect
  const [ w, h ] = rectSize(rect)
  return [ x, y, w, h ]
}

function boxRect(box) {
  const [ x, y, w, h ] = box
  return [ x, y, x + w, y + h ]
}

function rectRadial(rect) {
  const [ cx, cy ] = rectCenter(rect)
  const [ w, h ] = rectSize(rect)
  const [ rx, ry ] = [ w / 2, h / 2 ]
  return [ cx, cy, rx, ry ]
}

function radialRect(rect) {
  const [ cx, cy, rx, ry ] = rect
  return [ cx - rx, cy - ry, cx + rx, cy + ry ]
}

function embedAspect(rect, aspect) {
  if (aspect == null) return rect
  let [ cx, cy, rx, ry ] = rectRadial(rect)
  if (rx > ry * aspect) {
    rx = ry * aspect
  } else if (rx < ry * aspect) {
    ry = rx / aspect
  }
  return radialRect([ cx, cy, rx, ry ])
}

function rectMap(prect, crect, args = {}) {
  const { aspect = null, coords = DEFAULT_COORDS } = args
  const [ px, py, pw, ph ] = rectBox(prect)
  const [ cx, cy, cw, ch ] = rectBox(coords)
  const [ cx1, cy1, cx2, cy2 ] = crect
  const [ fx1, fy1, fx2, fy2 ] = [
    (cx1 - cx) / cw, (cy1 - cy) / ch,
    (cx2 - cx) / cw, (cy2 - cy) / ch,
  ]
  const prect1 = [
    px + fx1 * pw, py + fy1 * ph,
    px + fx2 * pw, py + fy2 * ph,
  ]
  return embedAspect(prect1, aspect)
}

function rectShrink(rect, factor) {
  const frect = [ factor, factor, 1 - factor, 1 - factor ]
  return rectMap(rect, frect)
}

function rectExpand(rect, factor) {
  const frect = [ -factor, -factor, 1 + factor, 1 + factor ]
  return rectMap(rect, frect)
}

function pointMap(crect, fpoint) {
  const [ x, y, w, h ] = rectBox(crect)
  const [ fx, fy ] = fpoint
  return [ x + fx * w, y + fy * h ]
}

function outerRect(rects) {
  if (rects.length === 0) return null
  return rects.reduce(
    ([ xa1, ya1, xa2, ya2 ], [ xb1, yb1, xb2, yb2 ]) => [
      min(xa1, xb1), min(ya1, yb1), max(xa2, xb2), max(ya2, yb2)
    ]
  )
}

//
// text sizing
//

// font defaults
const DEFAULT_FONT_FAMILY = 'IBMPlexSans'
const DEFAULT_FONT_WEIGHT = 100
const DEFAULT_FONT_SIZE = 12

function calcTextAspect(text, args = {}) {
  const {
    family = DEFAULT_FONT_FAMILY,
    weight = DEFAULT_FONT_WEIGHT,
    size = DEFAULT_FONT_SIZE,
  } = args
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  ctx.font = `${weight} ${size}px ${family}`
  const { width } = ctx.measureText(text)
  canvas.remove()
  return width / size
}

//
// exports
//

export {
  DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_COORDS, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE, isNumber, isArray, isString, isObject, isFunction, zip, range, linspace, max, min, sum, cumsum, rectSize, rectCenter, rectBox, boxRect, rectRadial, radialRect, embedAspect, rectMap, rectShrink, rectExpand, pointMap, outerRect, rectAspect, calcTextAspect, red, green, blue,
}
