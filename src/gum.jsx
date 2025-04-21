//
// gum
//

import { Component, Children, cloneElement } from 'react'
import {
  max, min, sum, cumsum, rectSize, rectBox, rectRadial,
  rectMap, fracShrink, pointMap, calcTextAspect,
  DEFAULT_SIZE, DEFAULT_PROP, red, green, blue,
} from './utils'

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
    {Children.map(children, child => {
      const aspect = child.props.aspect ?? child.type.calculateAspect?.(child.props)
      const rect1 = rectMap(rect, child.props.rect, aspect)
      return child ? cloneElement(child, { rect: rect1, aspect }) : null
    })}
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
      { border > 0 && <Rect strokeWidth={border} /> }
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
// text
//

function Text({ children, rect, aspect, color = "black", ...props }) {
    const [ x, y, w, h ] = rectBox(rect)

    // get embedded position
    const y1 = y + h
    const h0 = w / aspect

    // render text
    return <text
      x={x}
      y={y1}
      fontSize={h0}
      fill={color}
      stroke={color}
      {...props}
    >
      {children}
    </text>
}

Text.calculateAspect = (props) => {
  return calcTextAspect(props.children)
}

//
// exports
//

export default {
  Group, Svg, Frame, Stack, HStack, VStack, Rect, Square, Ellipse, Circle,
  Line, Polyline, Polygon, Text, red, green, blue,
}
