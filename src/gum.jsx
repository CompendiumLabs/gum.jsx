//
// gum
//

import {
  Children, cloneElement, isValidElement, createContext, useContext, useState, useLayoutEffect, useMemo, useRef
} from 'react'

import {
  isNumber, zip, linspace, all, any, max, min, sum, cumsum, rectBox, rectRadial, rectMap, rectExpand, pointMap, outerRect, rectAspect, calcTextAspect, DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_COORDS, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE
} from './utils'

//
// react tools
//

function extractProp(children, prop) {
  return Children.toArray(children).map(child => {
    if (!isValidElement(child)) return null
    return child.props[prop] ?? null
  })
}

// for processing children react style
function mapChildren(children, fn) {
  return Children.toArray(children).map((child, index) => {
    if (!isValidElement(child)) return null
    return fn(child, index)
  })
}

function useRegistry(setValues) {
  return useMemo(() => ({
    register(id, value) {
      setValues(prev => {
        const next = new Map(prev)
        next.set(id, value)
        return next
      })
    },
    unregister(id) {
      setValues(prev => {
        const next = new Map(prev)
        next.delete(id)
        return next
      })
    }
  }), [])
}

function useMappedValues(children) {
  const [values, setValues] = useState(new Map())

  // wrap children with ids
  const wrapped = useMemo(() => {
    return mapChildren(children, (child, i) => (
      cloneElement(child, { id: i })
    ))
  }, [children])

  // create a map of values
  const items = useMemo(() => {
    return mapChildren(wrapped, (child, i) => values.get(i))
  }, [wrapped, values])

  // return all objects
  return [wrapped, items, setValues]
}

const MappedValuesContext = createContext()
function MappedValuesProvider({ children, setValues }) {
  const registry = useRegistry(setValues)
  return <MappedValuesContext.Provider value={registry}>
    {children}
  </MappedValuesContext.Provider>
}

function useValueContext(id, value) {
  const ctx = useContext(MappedValuesContext)
  const prev = useRef(null)
  useLayoutEffect(() => {
    if (ctx == null) return
    if (prev.current == null || prev.current != value) {
      ctx.register(id, value)
      prev.current = value
    }
    return () => ctx.unregister(id)
  }, [id, value, ctx])
  return v => ctx?.register(id, v)
}

function useMappedArray(children) {
  const [ values, setValues ] = useState(new Map())
  const items = useMemo(() => {
    return mapChildren(children, (child, i) => values.get(i))
  }, [children, values])
  return [ items, setValues ]
}

//
// core components
//

// the Element component is still undeclared, but should implement:
// - rect: target rect [ x1, y1, x2, y2 ]
// - coords: coords [ xlo, ylo, xhi, yhi ]
// - tag: tag name (default: 'g')
// - props: additional props

// child properties for placement
// INPUT PROPS:
// rect: target rect [ x1, y1, x2, y2 ]
// aspect: specified aspect ratio (w / h)
// OUTPUT PROPS:
// rect: final rect [ x1, y1, x2, y2 ]
// aspect: final aspect ratio (w / h)

function embedChildren(children, ratios, rect, coords) {
  return mapChildren(children, (child, index) => {
    const aspect = ratios[index]
    const { rect: crect = DEFAULT_RECT } = child.props
    const rect1 = rectMap(rect, crect, { aspect, coords })
    return cloneElement(child, { rect: rect1 })
  })
}

function outerAspect(children, ratios) {
  const rects = mapChildren(children, (child, index) => {
    const aspect = ratios[index]
    const { rect: crect = DEFAULT_RECT } = child.props
    return rectMap(DEFAULT_RECT, crect, { aspect })
  }).filter(r => r != null)
  if (rects.length == 0) return null
  const outer = outerRect(rects)
  return rectAspect(outer)
}

function Group({ id, rect, children, aspect, updateRatios, tag = 'g', coords = DEFAULT_COORDS, ...props }) {
  const [ wrapped, ratios, setRatios ] = useMappedValues(children)
  useValueContext(id, aspect)

  const handleRatios = (ratios) => {
    setRatios(ratios)
    if (updateRatios != null) updateRatios(ratios)
  }

  // render group element
  const Tag = tag
  return <Tag {...props}>
    <MappedValuesProvider setValues={handleRatios}>
      {embedChildren(wrapped, ratios, rect, coords)}
    </MappedValuesProvider>
  </Tag>
}

function Svg({ children, size = DEFAULT_SIZE, coords = DEFAULT_COORDS, ...props }) {
  const [ ratios, setRatios ] = useMappedArray(children)

  // get aspect adjusted size
  if (isNumber(size)) {
    const aspect = outerAspect(children, ratios)
    const aspect2 = Math.sqrt(aspect)
    size = [size * aspect2, size / aspect2 ]
  }

  // compute svg rect
  const [ w, h ] = size
  const rect = [ 0, 0, w, h ]
  const props1 = { width: w, height: h, ...DEFAULT_PROP, ...props }

  // render svg element
  return <Group tag="svg" rect={rect} updateRatios={setRatios} {...props1}>
    {children}
  </Group>
}

//
// layout components
//

function Frame({ id, rect, children, aspect, padding = 0, margin = 0, border = 0, coords = DEFAULT_COORDS, ...props }) {
  const emitAspect = useValueContext(id, aspect)
  const [ ratios, setRatios ] = useMappedArray(children)

  // recompute aspect when child ratios change
  useLayoutEffect(() => {
    const newAspect = ratios.reduce((acc, a) => acc ?? a, null)
    if (aspect == null) emitAspect(newAspect)
  }, [ratios])

  // get outer and inner coords
  const coordsOuter = rectExpand(coords, padding + margin)
  const coordsInner = rectExpand(coords, padding)

  // render frame element
  return <Group rect={rect} coords={coordsOuter} updateRatios={setRatios} {...props}>
    {children}
    { border > 0 && <Rect rect={coordsInner} strokeWidth={border} /> }
  </Group>
}

function distribute(sizes, target = 1) {
  const total = sum(sizes)
  const empty = sum(sizes.map(s => s == null))
  const fills = max(0, target - total) / empty
  return sizes.map(s => s ?? fills)
}

function computeStackLayout(direction, children, ratios) {
  const nchild = children.length
  const sizes0 = extractProp(children, 'size')
  const sizes = distribute(sizes0)
  if (all(ratios.map(r => r != null))) {
    const aspect = (direction == "horizontal") ?
      (sum(zip(sizes, ratios).map(([s, r]) => s * r)) * nchild) :
      (1 / sum(zip(sizes, ratios).map(([s, r]) => s / r)) / nchild)
    return [ sizes, aspect ]
  }
  return [ sizes, null ]
}

// control sizing with { size: number } property
// TODO: compute aspect from children when possible
function Stack({ id, rect, children, aspect, direction = "vertical", ...props }) {
  const emitAspect = useValueContext(id, aspect)
  const [ ratios, setRatios ] = useMappedArray(children)
  const [ sizes, setSizes ] = useState(null)

  // compute aspect and sizes
  useLayoutEffect(() => {
    const [ newSizes, newAspect ] = computeStackLayout(direction, children, ratios)
    if (aspect == null) emitAspect(newAspect)
    setSizes(newSizes)
  }, [children, aspect, ratios])

  // bail if layout not ready
  if (sizes == null) return null
  const bound = cumsum(sizes)

  // render elements
  return <Group rect={rect} updateRatios={setRatios} {...props}>
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

function Rect({ id, rect, aspect, ...props }) {
  useValueContext(id, aspect)
  let [ x, y, w, h ] = rectBox(rect)
  if (w < 0) { x += w; w = -w }
  if (h < 0) { y += h; h = -h }
  return <rect x={x} y={y} width={w} height={h} {...props} />
}

function Square({ id, rect, aspect, ...props }) {
  useValueContext(id, 1)
  const [ x, y, w, h ] = rectBox(rect)
  const s = min(w, h)
  return <rect x={x} y={y} width={s} height={s} {...props} />
}

function Ellipse({ id, rect, aspect, ...props }) {
  useValueContext(id, aspect)
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ id, rect, aspect, ...props }) {
  useValueContext(id, 1)
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  const r = min(rx, ry)
  return <circle cx={cx} cy={cy} r={r} {...props} />
}

//
// lines
//

function Line({ id, rect, aspect, ...props }) {
  useValueContext(id, aspect)
  const [ x1, y1, x2, y2 ] = rectBox(rect)
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...props} />
}

function pointString(rect, points) {
  return points
    .map(p => pointMap(rect, p))
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

function Polyline({ id, rect, aspect, ...props }) {
  useValueContext(id, aspect)
  const pstring = pointString(rect, points)
  return <polyline points={pstring} {...props} />
}

function Polygon({ id, rect, aspect, ...props }) {
  useValueContext(id, aspect)
  const pstring = pointString(rect, points)
  return <polygon points={pstring} {...props} />
}

//
// text
//

function Text({
  id, children, rect, color = "black", fontFamily = DEFAULT_FONT_FAMILY,
  fontWeight = DEFAULT_FONT_WEIGHT, fontSize = DEFAULT_FONT_SIZE, ...props
}) {
  // get aspect ratio
  const aspect = calcTextAspect(children, { fontFamily, fontWeight })
  useValueContext(id, aspect)

  // get embedded position
  const [ x, y, w, h ] = rectBox(rect)
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

function Symline({ id, rect, aspect, fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  useValueContext(id, aspect)
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polyline rect={rect} points={points} {...props} />
}

function Sympoly({ id, rect, aspect, fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  useValueContext(id, aspect)
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polygon rect={rect} points={points} {...props} />
}

//
// plotting
//

function Graph({ id, children, aspect, coords = DEFAULT_COORDS, ...props}) {
  useValueContext(id, aspect)
  const [ xlo, ylo, xhi, yhi ] = coords
  const coords1 = [ xlo, yhi, xhi, ylo ]
  return <Group {...props}>
    {mapChildren(children, child => {
      return cloneElement(child, { coords: coords1 })
    })}
  </Group>
}

//
// exports
//

export default {
  Group, Svg, Frame, Stack, HStack, VStack, Rect, Square, Ellipse, Circle, Line, Polyline, Polygon, Text, Symline, Sympoly, Graph, useMappedValues, useValueContext, MappedValuesProvider
}
