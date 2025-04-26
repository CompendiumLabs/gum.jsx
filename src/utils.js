//
// utility
//

//
// constants
//

const DEFAULT_SIZE = 500
const DEFAULT_RECT = [ 0, 0, 1, 1 ]
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
// math funcs
//

function max(...arr) {
  return Math.max(...arr)
}

function min(...arr) {
  return Math.min(...arr)
}

function sum(arr) {
  return arr.reduce((a, b) => a + b, 0)
}

function cumsum(arr) {
  return arr.reduce((a, b) => [...a, a[a.length - 1] + b], [0])
}

//
// rect tools
//

function rectSize(rect) {
  const [ x1, y1, x2, y2 ] = rect
  return [ x2 - x1, y2 - y1 ]
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

function rectMap(crect, frect = DEFAULT_RECT, aspect = null) {
  const [ x, y, w, h ] = rectBox(crect)
  const [ fx1, fy1, fx2, fy2 ] = frect
  const prect = [ x + fx1 * w, y + fy1 * h, x + fx2 * w, y + fy2 * h ]
  return embedAspect(prect, aspect)
}

function rectShrink(rect, factor) {
  const frect = [ factor, factor, 1 - factor, 1 - factor ]
  return rectMap(rect, frect)
}

function fracShrink(factor) {
  return rectShrink(DEFAULT_RECT, factor)
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
const DEFAULT_FONT_FAMILY = 'sans-serif'
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
  DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT,
  DEFAULT_FONT_SIZE, max, min, sum, cumsum, rectSize, rectCenter, rectBox, boxRect,
  rectRadial, radialRect, embedAspect, rectMap, rectShrink, fracShrink, pointMap,
  outerRect, calcTextAspect, red, green, blue,
}
