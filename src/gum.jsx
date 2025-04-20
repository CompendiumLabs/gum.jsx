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

function rectMap(crect, frect) {
  const { x1: cx1, y1: cy1, x2: cx2, y2: cy2 } = crect
  const { x1: fx1, y1: fy1, x2: fx2, y2: fy2 } = frect
  const [ cw, ch ] = [ cx2 - cx1, cy2 - cy1 ]
  return {
    x1: cx1 + fx1 * cw,
    y1: cy1 + fy1 * ch,
    x2: cx1 + fx2 * cw,
    y2: cy1 + fy2 * ch,
  }
}

function rectSize(rect) {
  const { x1, y1, x2, y2 } = rect
  return { w: x2 - x1, h: y2 - y1 }
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
        rect: rectMap(rect, child.props.rect ?? DEFAULT_RECT),
      }) : null
    )}
  </Tag>
}

function Svg({ children, rect, size = DEFAULT_SIZE, ...props }) {
  rect ??= { x1: 0, y1: 0, x2: size, y2: size }
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
  const { x1, y1 } = rect
  const { w, h } = rectSize(rect)
  return <rect x={x1} y={y1} width={w} height={h} {...props} />
}

function Ellipse({ rect, ...props }) {
  const { x1, y1 } = rect
  const { w, h } = rectSize(rect)
  const [ cx, cy ] = [ x1 + w / 2, y1 + h / 2 ]
  const [ rx, ry ] = [ w / 2, h / 2 ]
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ rect, ...props }) {
  const { x1, y1 } = rect
  const { w, h } = rectSize(rect)
  const [ cx, cy ] = [ x1 + w / 2, y1 + h / 2 ]
  const [ rx, ry ] = [ w / 2, h / 2 ]
  const r = min(rx, ry)
  return <circle cx={cx} cy={cy} r={r} {...props} />
}

export default { Group, Svg, Frame, Stack, HStack, VStack, Rect, Ellipse, Circle }
