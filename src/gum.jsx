//
// gum
//

import {
  Children, cloneElement, isValidElement, createContext, useContext, useState, useLayoutEffect, useMemo, useRef
} from 'react'

import {
  isNumber, zip, linspace, max, min, sum, cumsum, rectBox, rectRadial, rectMap, rectExpand, pointMap, outerRect, rectAspect, calcTextAspect, DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_COORDS, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE
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
    if (!isValidElement(child)) return child
    return fn(child, index)
  })
}

// for processing children and extracting information
function mapComponents(children, fn) {
  return Children.toArray(children).map(child => {
    if (!isValidElement(child)) return null
    return fn(child)
  }).filter(el => el != null)
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

function useMappedValueContext(id, value) {
  const ctx = useContext(MappedValuesContext)
  const prev = useRef(null)
  useLayoutEffect(() => {
    if (prev.current == null || prev.current != value) {
      ctx.register(id, value)
      prev.current = value
    }
    return () => ctx.unregister(id)
  }, [id, value, ctx])
  return v => ctx.register(id, v)
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

function mapRatios(children, ratios, fn) {
  return mapComponents(children, (child) => {
    const { id } = child.props
    const aspect = ratios[id]
    return fn(child, aspect)
  })
}

function embedChildren(children, ratios, rect, coords) {
  return mapRatios(children, ratios, (child, aspect) => {
    const { rect: crect = DEFAULT_RECT } = child.props
    const rect1 = rectMap(rect, crect, { aspect, coords })
    return cloneElement(child, { rect: rect1 })
  })
}

function outerAspect(children, ratios) {
  const rects = mapRatios(children, ratios, (child, aspect) => {
    const { rect: crect = DEFAULT_RECT } = child.props
    return rectMap(DEFAULT_RECT, crect, { aspect })
  })
  if (rects.length == 0) return null
  const outer = outerRect(rects)
  return rectAspect(outer)
}

function Group({ id, rect, children, aspect, updateRatios, coords = DEFAULT_COORDS, ...props }) {
  const [wrapped, ratios, setRatios] = useMappedValues(children)
  useMappedValueContext(id, aspect)

  const handleRatios = (ratios) => {
    setRatios(ratios)
    if (updateRatios != null) updateRatios(ratios)
  }

  // render group element
  return <g {...props}>
    <MappedValuesProvider setValues={handleRatios}>
      {embedChildren(wrapped, ratios, rect, coords)}
    </MappedValuesProvider>
  </g>
}

function Svg({ children, size = DEFAULT_SIZE, coords = DEFAULT_COORDS, ...props }) {
  const [wrapped, ratios, setRatios] = useMappedValues(children)

  // get aspect adjusted size
  if (isNumber(size)) {
    const aspect = outerAspect(wrapped, ratios)
    const aspect2 = Math.sqrt(aspect)
    size = [size * aspect2, size / aspect2 ]
  }

  // compute svg rect
  const [ w, h ] = size
  const rect = [ 0, 0, w, h ]

  // render svg element
  return <svg width={w} height={h} {...DEFAULT_PROP} {...props}>
    <MappedValuesProvider setValues={setRatios}>
      {embedChildren(wrapped, ratios, rect, coords)}
    </MappedValuesProvider>
  </svg>
}

//
// layout components
//

// this works when you don't need to associate a specific aspect with a specific child
function useComputedAspect(id, computeAspect) {
  const setAspect = useMappedValueContext(id, null)
  const [ ratios, setRatios ] = useState(new Map())

  // recompute aspect when child ratios change
  useMemo(() => {
    const aspect = computeAspect(ratios)
    setAspect(aspect)
  }, [ratios])

  return setRatios
}

function Frame({ id, rect, children, padding = 0, margin = 0, border = 0, coords = DEFAULT_COORDS, ...props }) {
  const setRatios = useComputedAspect(id, ratios =>
    [...ratios.values()].reduce((acc, a) => acc ?? a, null)
  )

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

// control sizing with { size: number } property
// TODO: compute aspect from children when possible
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

function Rect({ id, rect, aspect, ...props }) {
  useMappedValueContext(id, aspect)
  let [ x, y, w, h ] = rectBox(rect)
  if (w < 0) { x += w; w = -w }
  if (h < 0) { y += h; h = -h }
  return <rect x={x} y={y} width={w} height={h} {...props} />
}

function Square({ id, rect, aspect, ...props }) {
  useMappedValueContext(id, 1)
  const [ x, y, w, h ] = rectBox(rect)
  const s = min(w, h)
  return <rect x={x} y={y} width={s} height={s} {...props} />
}

function Ellipse({ id, rect, aspect, ...props }) {
  useMappedValueContext(id, aspect)
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ id, rect, aspect, ...props }) {
  useMappedValueContext(id, 1)
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

function Text({
  id, children, rect, color = "black", fontFamily = DEFAULT_FONT_FAMILY,
  fontWeight = DEFAULT_FONT_WEIGHT, fontSize = DEFAULT_FONT_SIZE, ...props
}) {
  // get aspect ratio
  const aspect = calcTextAspect(children, { fontFamily, fontWeight })
  useMappedValueContext(id, aspect)

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

function Symline({ rect, fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polyline rect={rect} points={points} {...props} />
}

function Sympoly({ rect, fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polygon rect={rect} points={points} {...props} />
}

//
// plotting
//

function Graph({ children, coords = DEFAULT_COORDS, ...props}) {
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
  Group, Svg, Frame, Stack, HStack, VStack, Rect, Square, Ellipse, Circle, Line, Polyline, Polygon, Text, Symline, Sympoly, Graph, useMappedValues, useMappedValueContext, MappedValuesProvider
}
