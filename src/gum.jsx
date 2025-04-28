//
// gum
//

import { Children, cloneElement } from 'react'
import {
  zip, linspace, max, min, sum, cumsum, rectSize, rectBox, rectRadial, rectMap,
  fracShrink, pointMap, outerRect, calcTextAspect, red, green, blue,
  DEFAULT_SIZE, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY,
  DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE
} from './utils'

//
// defaults
//

//
// react tools
//

function extractProp(children, prop) {
  return Children.toArray(children).map(child => {
    if (child == null) return null
    if (child.props == null) return null
    return child.props[prop] ?? null
  })
}

function mapChildren(children, fn) {
  return Children.map(children, (child, index) => {
    if (child == null) return null
    if (child.type == null) return child
    return fn(child, index)
  })
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

function getAspect(child) {
  return child.props.aspect ?? child.type.defaultAspect?.(child.props)
}

function Group({ rect, children, tag = "g", ...props }) {
  const Tag = tag
  return <Tag {...props}>
    {mapChildren(children, child => {
      const aspect = getAspect(child)
      const rect1 = rectMap(rect, child.props.rect, aspect)
      return cloneElement(child, { rect: rect1, aspect })
    })}
  </Tag>
}

Group.defaultAspect = (props) => {
  const { children } = props
  const rects = Children.toArray(children)
    .filter(child => child != null)
    .map(child => child.props.rect)
    .filter(rect => rect != null)
  return outerRect(rects)
}

function Svg({ children, rect, aspect = 1, size = DEFAULT_SIZE, ...props }) {
  const aspect2 = Math.sqrt(aspect)
  rect ??= [ 0, 0, size * aspect2, size / aspect2 ]
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

// TODO: need to account for padding and margin
Frame.defaultAspect = (props) => {
  const { children } = props
  return Children.toArray(children)
    .map(getAspect)
    .reduce((a, b) => a ?? b, null)
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
    {mapChildren(children, (child, index) => {
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
// symbolic
//

function sympath({ fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N }) {
  if (fx == null && fy != null) {
    const [ xlo, xhi ] = xlim
    const xvals = linspace(xlo, xhi, N)
    const yvals = xvals.map(fy)
    return zip(xvals, yvals)
  } else if (fy == null && fx != null) {
    const [ ylo, yhi ] = ylim
    const yvals = linspace(ylo, yhi, N)
    const xvals = yvals.map(fx)
    return zip(xvals, yvals)
  } else if (fx != null && fy != null) {
    const [ tlo, thi ] = tlim
    const tvals = linspace(tlo, thi, N)
    const xvals = tvals.map(fx)
    const yvals = tvals.map(fy)
    return zip(xvals, yvals)
  } else {
    throw new Error('must specify either fx, fy, or both')
  }
}

function Symline({ rect, fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polyline rect={rect} points={points} {...props} />
}

function Sympoly({ rect, fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polygon rect={rect} points={points} {...props} />
}

//
// text
//

function Text({
  children, rect, aspect, color = "black", fontFamily = DEFAULT_FONT_FAMILY,
  fontWeight = DEFAULT_FONT_WEIGHT, fontSize = DEFAULT_FONT_SIZE, ...props
}) {
  const [ x, y, w, h ] = rectBox(rect)

  // get embedded position
  const y1 = y + h
  const h0 = w / aspect

  // render text
  return <text
    x={x}
    y={y1}
    fontSize={h0}
    fontFamily={fontFamily}
    fontWeight={fontWeight}
    fill={color}
    stroke={color}
    {...props}
  >
    {children}
  </text>
}

Text.defaultAspect = (props) => {
  const { children, fontFamily, fontWeight } = props
  return calcTextAspect(children, { fontFamily, fontWeight })
}

//
// exports
//

export default {
  Group, Svg, Frame, Stack, HStack, VStack, Rect, Square, Ellipse, Circle,
  Line, Polyline, Polygon, Symline, Sympoly, Text, red, green, blue,
}
