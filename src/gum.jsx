//
// gum
//

import { Children, cloneElement } from 'react'

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
// util funcs
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
  let { cx, cy, rx, ry } = rectRadial(rect)
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

//
// react tools
//

function extractProp(children, prop) {
  return Children.toArray(children).map(
    child => child.props[prop] ?? null
  )
}

//
// core components
//

// child properties for placement
// INPUT PROPS:
// rect: target rect { x1, y1, x2, y2 }
// aspect: aspect ratio (w / h)
// OUTPUT PROPS:
// rect: final rect { x1, y1, x2, y2 }

function Group({ rect, children, tag = "g", ...props }) {
  const Tag = tag
  return <Tag {...props}>
    {Children.map(children, child =>
      child ? cloneElement(child, {
        rect: rectMap(rect, child.props.rect, child.props.aspect),
      }) : null
    )}
  </Tag>
}

function Svg({ children, rect, size = DEFAULT_SIZE, ...props }) {
  rect ??= [ 0, 0, size, size ]
  const [ w, h ] = rectSize(rect)
  return <Group tag="svg" rect={rect} width={w} height={h} {...DEFAULT_PROP} {...props}>
    {children}
  </Group>
}

//
// layout components
//

function Frame({ children, padding = 0, margin = 0, border = 0, ...props }) {
  return <Group {...props}>
    <Group rect={fracShrink(margin)}>
      <Group rect={fracShrink(padding)}>
        {children}
      </Group>
      { border > 0 && <Rect stroke-width={border} /> }
    </Group>
  </Group>
}

function distribute(sizes, target = 1) {
  const total = sum(sizes)
  const empty = sum(sizes.map(s => s == null))
  const fills = max(0, target - total) / empty
  return sizes.map(s => s ?? fills)
}

// control sizing with { size: number } property
function Stack({ children, direction = "vertical", ...props }) {
  // get specified sizes
  const size0 = extractProp(children, 'size')
  const sizes = distribute(size0)
  const bound = cumsum(sizes)

  // render elements
  return <Group {...props}>
    {Children.map(children, (child, index) => {
      const [ lo, hi ] = [ bound[index], bound[index + 1] ]
      const [ x1, y1, x2, y2 ] = direction == "horizontal" ?
        [ lo, 0, hi, 1 ] : [ 0, lo, 1, hi ]
      return cloneElement(child, {
        rect: [ x1, y1, x2, y2 ],
      })
    })}
  </Group>
}

function HStack({ children, ...props }) {
  return <Stack direction="horizontal" {...props}>{children}</Stack>
}

function VStack({ children, ...props }) {
  return <Stack direction="vertical" {...props}>{children}</Stack>
}

//
// basic shapes
//

function Rect({ rect, ...props }) {
  const [ x, y, w, h ] = rectBox(rect)
  return <rect x={x} y={y} width={w} height={h} {...props} />
}

function Square({ rect, ...props }) {
  const [ x, y, w, h ] = rectBox(rect)
  const s = min(w, h)
  return <rect x={x} y={y} width={s} height={s} {...props} />
}

function Ellipse({ rect, ...props }) {
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ rect, ...props }) {
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  const r = min(rx, ry)
  return <circle cx={cx} cy={cy} r={r} {...props} />
}

//
// lines
//

function Line({ rect, ...props }) {
  const [ x1, y1, x2, y2 ] = rectBox(rect)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...props} />
}

function pointString(rect, points) {
  return points
    .map(p => pointMap(rect, p))
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

function Polyline({ rect, points, ...props }) {
  const pstring = pointString(rect, points)
  return <polyline points={pstring} {...props} />
}

function Polygon({ rect, points, ...props }) {
  const pstring = pointString(rect, points)
  return <polygon points={pstring} {...props} />
}

//
// exports
//

export default {
  Group, Svg, Frame, Stack, HStack, VStack,
  Rect, Square, Ellipse, Circle,
  Line, Polyline, Polygon,
  red, blue, green,
}
