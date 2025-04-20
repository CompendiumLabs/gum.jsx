//
// gum
//

import { Children, cloneElement } from 'react'

//
// constants
//

const DEFAULT_SIZE = 500
const DEFAULT_RECT = { x1: 0, y1: 0, x2: 1, y2: 1 }
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
  const { x1, y1, x2, y2 } = rect
  return { w: x2 - x1, h: y2 - y1 }
}

function rectCenter(rect) {
  const { x1, y1, x2, y2 } = rect
  return { cx: (x1 + x2) / 2, cy: (y1 + y2) / 2 }
}

function rectBox(rect) {
  const { x1: x, y1: y } = rect
  const { w, h } = rectSize(rect)
  return { x, y, w, h }
}

function boxRect(box) {
  const { x, y, w, h } = box
  return { x1: x, y1: y, x2: x + w, y2: y + h }
}

function rectRadial(rect) {
  const { cx, cy } = rectCenter(rect)
  const { w, h } = rectSize(rect)
  const [ rx, ry ] = [ w / 2, h / 2 ]
  return { cx, cy, rx, ry }
}

function radialRect(rect) {
  const { cx, cy, rx, ry } = rect
  return {
    x1: cx - rx,
    y1: cy - ry,
    x2: cx + rx,
    y2: cy + ry,
  }
}

function embedAspect(rect, aspect) {
  if (aspect == null) return rect
  let { cx, cy, rx, ry } = rectRadial(rect)
  if (rx > ry * aspect) {
    rx = ry * aspect
  } else if (rx < ry * aspect) {
    ry = rx / aspect
  }
  const rrect = { cx, cy, rx, ry }
  return radialRect(rrect)
}

function rectMap(crect, frect = DEFAULT_RECT, aspect = null) {
  const { x1: cx1, y1: cy1, x2: cx2, y2: cy2 } = crect
  const { x1: fx1, y1: fy1, x2: fx2, y2: fy2 } = frect
  const { w, h } = rectSize(crect)
  const prect = {
    x1: cx1 + fx1 * w,
    y1: cy1 + fy1 * h,
    x2: cx1 + fx2 * w,
    y2: cy1 + fy2 * h,
  }
  return embedAspect(prect, aspect)
}

function rectShrink(rect, factor) {
  const frect = { x1: factor, y1: factor, x2: 1 - factor, y2: 1 - factor }
  return rectMap(rect, frect)
}

function fracShrink(factor) {
  return rectShrink(DEFAULT_RECT, factor)
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
  rect ??= boxRect({ x: 0, y: 0, w: size, h: size })
  const { w, h } = rectSize(rect)
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
        rect: { x1, y1, x2, y2 },
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
  const { x, y, w, h } = rectBox(rect)
  return <rect x={x} y={y} width={w} height={h} {...props} />
}

function Ellipse({ rect, ...props }) {
  const { cx, cy, rx, ry } = rectRadial(rect)
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ rect, ...props }) {
  const { cx, cy, rx, ry } = rectRadial(rect)
  const r = min(rx, ry)
  return <circle cx={cx} cy={cy} r={r} {...props} />
}

export default {
  Group, Svg, Frame, Stack, HStack, VStack, Rect, Ellipse, Circle,
  red, blue, green,
}
