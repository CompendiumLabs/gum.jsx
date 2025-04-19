//
// gum
//

import { Children, cloneElement } from 'react'

//
// constants
//

const DEFAULT_SIZE = 500
const DEFAULT_RECT = { x1: 0, y1: 0, x2: 1, y2: 1 }

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

//
// containers
//

function Group({ rect, children, tag = "g", ...props }) {
  const Tag = tag
  return <Tag {...props}>
    {Children.map(children, (child) =>
      cloneElement(child, {
        rect: rectMap(rect, child.props.rect ?? DEFAULT_RECT),
      })
    )}
  </Tag>
}

function Svg({ children, rect, size = DEFAULT_SIZE, ...props }) {
  rect ??= { x1: 0, y1: 0, x2: size, y2: size }
  const { w, h } = rectSize(rect)
  return <Group tag="svg" rect={rect} width={w} height={h} {...props}>
    {children}
  </Group>
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

export default { Group, Svg, Rect, Ellipse }
