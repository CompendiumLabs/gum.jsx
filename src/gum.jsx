//
// gum
//

import {
  Children, cloneElement, isValidElement, createContext, useContext, useState, useLayoutEffect, useMemo, useRef
} from 'react'

import {
  isNumber, zip, range, linspace, all, any, max, min, sum, cumsum, add, sub, mul, div, invert, rectBox, rectRadial, rectMap, rectExpand, pointMap, outerRect, rectAspect, broadcastSize, extractPrefix, calcTextAspect, DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_COORDS, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE
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
  const setValue = v => ctx?.register(id, v)
  return [ prev.current, setValue ]
}

function useMappedArray(length) {
  const [ values, setValues ] = useState(new Map())
  const items = useMemo(() => {
    return range(length).map(i => values.get(i))
  }, [length, values])
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
  const nchildren = Children.count(children)
  const [ ratios, setRatios ] = useMappedArray(nchildren)

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

function computeFrameLayout(ratios, padding, margin) {
  // get aggregated aspect ratio (TODO: make this smarter)
  const aspect = ratios.reduce((acc, a) => acc ?? a, null)

  // adjust padding and margin to account for aspect ratio
  // wider dimensions get small fractional sizes so absolute sizes align
  const saspect = aspect != null ? Math.sqrt(aspect) : 1
  const adjust = [ 1 / saspect, saspect, 1 / saspect, saspect ]
  const padding1 = mul(broadcastSize(padding), adjust)
  const margin1 = mul(broadcastSize(margin), adjust)

  // compute aspect ratio of adjusted padding and margin box
  const [ px1, py1, px2, py2 ] = padding1
  const [ mx1, my1, mx2, my2 ] = margin1
  const afact = (1 + px1 + mx1 + px2 + mx2) / (1 + py1 + my1 + py2 + my2)
  const aspect1 = aspect != null ? aspect * afact : null

  // return computed layout
  return [ aspect1, padding1, margin1 ]
}

function Frame({ id, rect, children, aspect, padding = 0, margin = 0, border = 0, coords = DEFAULT_COORDS, ...props }) {
  const nchildren = Children.count(children)
  const [ aspect1, setAspect ] = useValueContext(id, aspect)
  const [ ratios, setRatios ] = useMappedArray(1 + nchildren)
  const [ padding1, setPadding ] = useState(null)
  const [ margin1, setMargin ] = useState(null)

  // get border prefix props
  const [ borderProps, props1 ] = extractPrefix('border', props)

  // recompute aspect when child ratios change
  useLayoutEffect(() => {
    if (aspect != null) return
    const [ newAspect, newPadding, newMargin ] = computeFrameLayout(ratios, padding, margin)
    setAspect(newAspect)
    setPadding(newPadding)
    setMargin(newMargin)
  }, [ratios, padding, margin])

  // bail if layout not ready
  if (padding1 == null || margin1 == null) return null

  // get outer and inner coords
  const coordsOuter = rectExpand(coords, add(padding1, margin1))
  const coordsInner = rectExpand(coords, padding1)

  // render frame element
  return <Group rect={rect} coords={coordsOuter} updateRatios={setRatios} {...props1}>
    { border > 0 && <Rect rect={coordsInner} strokeWidth={border} {...borderProps} /> }
    {children}
  </Group>
}

function computeStackLayout(direction, children, ratios) {
  // get size and aspect data from children
  // adjust for direction (invert aspect if horizontal)
  const items = children.map((c, i) => (
    { size: c.props.size, aspect: ratios[i] }
  ))
  if (direction == "horizontal") {
    for (const c of items) c.aspect = invert(c.aspect)
  }

  // for computing return values
  const getSizes = cs => cs.map(c => c.size ?? 0)
  const getAspect = direction == "vertical" ? invert : (h => h)

  // children = list of dicts with keys size (s_i) and aspect (a_i)
  // const fixed = children.filter(c => c.size != null && c.aspect == null)
  const over = items.filter(c => c.size != null && c.aspect != null)
  const expand = items.filter(c => c.size == null && c.aspect != null)
  const flex = items.filter(c => c.size == null && c.aspect == null)

  // get target aspect from over-constrained children
  // this is generically imperfect if len(over) > 1
  // single element case (exact): s * H * a = 1
  // multi element case (approximate): mean(s_i * H * a_i) = 1
  const H_over = over.length / sum(over.map(c => c.size * c.aspect))

  // knock out over-budgeted case right away
  // short-circuit since this is relatively simple
  const S_sum = sum(getSizes(items))
  if (S_sum > 1) {
    for (const c of items) c.size = (c.size ?? 0) / S_sum
    const aspect = getAspect(H_over)
    const sizes = getSizes(items)
    return [sizes, aspect]
  }

  // set height to maximally accommodate over-constrained children (or expandables)
  // H_expand adds up heights required to make expandables width 1
  const H_expand = sum(expand.map(c =>  1 / c.aspect)) / (1 - S_sum)
  const H_target = (over.length > 0) ? H_over : (expand.length > 0) ? H_expand : null

  // allocate space to expand then flex children
  // S_exp0 gets full height of expandables given realized H_target
  // S_exp is the same but constrained so the sums are less than 1
  const S_exp0 = sum(expand.map(c => 1 / (c.aspect * H_target)))
  const S_exp = Math.min(S_exp0, 1 - S_sum)
  const scale = S_exp / S_exp0 // this is 1 in the unconstrained case
  for (const c of expand) c.size = 1 / (c.aspect * H_target) * scale

  // distribute remaining space to flex children
  // S_left is the remaining space after pre-allocated and expandables (may hit 0)
  const S_left = 1 - S_sum - S_exp
  for (const c of flex) c.size = S_left / flex.length

  // compute heights and aspect
  const sizes = getSizes(items)
  const aspect = getAspect(H_target)
  return [sizes, aspect]
}

// control sizing with { size: number } property
// TODO: compute aspect from children when possible
function Stack({ id, rect, children, aspect, direction = "vertical", ...props }) {
  const nchildren = Children.count(children)
  const [ aspect1, setAspect ] = useValueContext(id, aspect)
  const [ ratios, setRatios ] = useMappedArray(nchildren)
  const [ sizes, setSizes ] = useState(null)

  // compute aspect and sizes
  useLayoutEffect(() => {
    if (aspect != null) return
    const [ newSizes, newAspect ] = computeStackLayout(direction, children, ratios)
    setAspect(newAspect)
    setSizes(newSizes)
  }, [aspect, children, ratios])

  // bail if layout not ready
  if (sizes == null) return null

  // get cumulative positions
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

function Spacer({ id, rect, aspect }) {
  useValueContext(id, aspect)
  return null
}

//
// basic shapes
//

function Rect({ id, rect, aspect, radius, ...props }) {
  useValueContext(id, aspect)
  let [ x, y, w, h ] = rectBox(rect)
  if (w < 0) { x += w; w = -w }
  if (h < 0) { y += h; h = -h }
  return <rect x={x} y={y} width={w} height={h} rx={radius} {...props} />
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

function pointString(prect, coords, points) {
  return points
    .map(p => pointMap(prect, p, { coords }))
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

function Polyline({ id, rect, aspect, coords, points, ...props }) {
  useValueContext(id, aspect)
  const pstring = pointString(rect, coords, points)
  return <polyline points={pstring} {...props} />
}

function Polygon({ id, rect, aspect, coords, points, ...props }) {
  useValueContext(id, aspect)
  const pstring = pointString(rect, coords, points)
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
  console.log('points', points)
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
  Group, Svg, Frame, Stack, HStack, VStack, Spacer, Rect, Square, Ellipse, Circle, Line, Polyline, Polygon, Text, Symline, Sympoly, Graph, useMappedValues, useValueContext, MappedValuesProvider
}
