//
// gum
//

import {
  Children, cloneElement, isValidElement, createContext, useContext, useState, useLayoutEffect, useMemo, useRef
} from 'react'

import {
  isNumber, zip, range, linspace, all, any, max, min, sum, cumsum, add, sub, mul, div, invert, notNull, rectBox, rectRadial, rectMap, limitMap, positionMap, rectExpand, pointMap, outerRect, outerLim, rectAspect, broadcastSize, invertDirection, extractPrefix, calcTextAspect, DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_COORDS, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE
} from './utils'

//
// react processing
//

// for processing children react style
function mapChildren(children, fn) {
  return Children.toArray(children).map((child, index) => {
    if (!isValidElement(child)) return null
    return fn(child, index)
  })
}

// extract property from children
function extractProperty(children, prop) {
  return mapChildren(children, (child, index) => {
    if (!isValidElement(child)) return null
    return child.props[prop]
  })
}

// track html parent element size
function useElementSize() {
  const elementRef = useRef(null)
  const [ size, setSize ] = useState(null)
  useLayoutEffect(() => {
    if (elementRef.current == null) return

    function updateSize() {
      const { width, height } = elementRef.current.getBoundingClientRect()
      setSize([ width, height ])
    }

    // listen for size changes
    updateSize()
    const resizeObserver = new ResizeObserver(updateSize)

    // hook up resize observer
    resizeObserver.observe(elementRef.current)
    return () => resizeObserver.disconnect()
  }, [])
  return [ elementRef, size ]
}

//
// container context
//

// this allows setting values by index but exposes a normal array
function useMappedArray(length) {
  const [mapped, setMapped] = useState(new Map())
  const setValue = (i, v) => setMapped(prev => {
    const next = new Map(prev)
    next.set(i, v)
    return next
  })
  const values = useMemo(() => {
    return range(length).map(i => mapped.get(i))
  }, [length, mapped])
  return [values, setValue]
}

// context for children to report values to parent
const MappedValuesContext = createContext()
function MappedValuesProvider({ children, setValue }) {
  // make a registry for child values
  const ctx = useMemo(() => ({
    register: (id, value) => setValue(id, value),
    unregister: (id) => setValue(id, null)
  }), [])

  // provide context
  return <MappedValuesContext.Provider value={ctx}>
    {children}
  </MappedValuesContext.Provider>
}

// useState-like hook for children to report values
// use reference to prevent unnecessary re-renders
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

function Group({ children, updateChildRatio, tag = 'g', id, rect, aspect, coords, ...props }) {
  // report aspect and track child ratios
  const nchildren = Children.count(children)
  const [childRatios, setChildRatios] = useMappedArray(nchildren)
  const [ aspect1, setAspect ] = useValueContext(id, aspect)

  // update ratios
  const handleRatio = (i, r) => {
    setChildRatios(i, r)
    updateChildRatio?.(i, r)
  }

  // render group element
  const Tag = tag
  return <Tag {...props}>
    <MappedValuesProvider setValue={handleRatio}>
      {mapChildren(children, (child, index) => {
        const caspect = childRatios[index]
        const { rect: crect = DEFAULT_RECT } = child.props
        const rect1 = rectMap(rect, crect, { aspect: caspect, coords })
        return cloneElement(child, { id: index, rect: rect1 })
      })}
    </MappedValuesProvider>
  </Tag>
}

// get the outer aspect ratio of a group of children
function outerAspect(children, ratios) {
  const rects = mapChildren(children, (child, index) => {
    const aspect = ratios[index]
    const { rect: crect = DEFAULT_RECT } = child.props
    return rectMap(DEFAULT_RECT, crect, { aspect })
  }).filter(notNull)
  if (rects.length == 0) return null
  const outer = outerRect(rects)
  return rectAspect(outer)
}

function Svg({ children, size = DEFAULT_SIZE, coords = DEFAULT_COORDS, ...props }) {
  const nchildren = Children.count(children)
  const [ childRatios, setChildRatio ] = useMappedArray(nchildren)
  const [ parentRef, parentSize ] = useElementSize()

  // compute aspect from child ratios
  const aspect = outerAspect(children, childRatios)

  // get aspect adjusted size
  if (isNumber(size)) {
    // get target size given aspect ratio
    const aspect2 = Math.sqrt(aspect)
    size = [size * aspect2, size / aspect2 ]
  }

  // scale size up/down if parent is smaller
  if (parentSize != null) {
    const over = Math.max(...div(size, parentSize))
    size = div(size, over)
  }

  // compute svg rect
  const [ w, h ] = size
  const rect = [ 0, 0, w, h ]

  // render svg element
  return <div ref={parentRef} className="w-full h-full flex justify-center items-center">
    <Group tag="svg" rect={rect} updateChildRatio={setChildRatio} width={w} height={h} {...DEFAULT_PROP} {...props}>
      {children}
    </Group>
  </div>
}

//
// layout components
//

function computeFrameLayout(aspect0, ratios, padding, margin, adjust) {
  // get aggregated aspect ratio (TODO: make this smarter)
  const aspect = aspect0 ?? ratios.reduce((acc, a) => acc ?? a, null)

  // adjust padding and margin to account for aspect ratio
  // wider dimensions get small fractional sizes so absolute sizes align
  const saspect = (adjust && aspect != null) ? Math.sqrt(aspect) : 1
  const adjusted = [ 1 / saspect, saspect, 1 / saspect, saspect ]
  const padding1 = mul(broadcastSize(padding), adjusted)
  const margin1 = mul(broadcastSize(margin), adjusted)

  // compute aspect ratio of adjusted padding and margin box
  const [ fx1, fy1, fx2, fy2 ] = add(padding1, margin1)
  const afact = (1 + fx1 + fx2) / (1 + fy1 + fy2)
  const aspect1 = aspect != null ? aspect * afact : null

  // return computed layout
  return [ aspect1, padding1, margin1 ]
}

function Frame({ children, padding = 0, margin = 0, border = 0, adjust = true, coords = DEFAULT_COORDS, id, rect, aspect, ...props }) {
  const nchildren = Children.count(children)
  const [ childRatios, setChildRatio ] = useMappedArray(1 + nchildren)
  const [ aspect1, setAspect ] = useValueContext(id, aspect)
  const [ padding1, setPadding ] = useState(null)
  const [ margin1, setMargin ] = useState(null)

  // get border prefix props
  const [ borderProps, props1 ] = extractPrefix('border', props)

  // recompute aspect when child ratios change
  useLayoutEffect(() => {
    const [ newAspect, newPadding, newMargin ] = computeFrameLayout(aspect, childRatios, padding, margin, adjust)
    setAspect(newAspect)
    setPadding(newPadding)
    setMargin(newMargin)
  }, [aspect, childRatios, padding, margin, adjust])

  // bail if layout not ready
  if (padding1 == null || margin1 == null) return null

  // get outer and inner coords
  const coordsOuter = rectExpand(coords, add(padding1, margin1))
  const coordsInner = rectExpand(coords, padding1)

  // render frame element
  return <Group rect={rect} coords={coordsOuter} updateChildRatio={setChildRatio} {...props1}>
    { border > 0 && <Rect rect={coordsInner} strokeWidth={border} {...borderProps} /> }
    {children}
  </Group>
}

function computeStackLayout(direction, children, ratios) {
  // get size and aspect data from children
  // adjust for direction (invert aspect if horizontal)
  const items = mapChildren(children, (c, i) => (
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
function Stack({ children, direction = "vertical", id, rect, aspect, ...props }) {
  const nchildren = Children.count(children)
  const [ childRatios, setChildRatio ] = useMappedArray(nchildren)
  const [ aspect1, setAspect ] = useValueContext(id, aspect)
  const [ sizes, setSizes ] = useState(null)

  // compute aspect and sizes
  useLayoutEffect(() => {
    if (aspect != null) return
    const [ newSizes, newAspect ] = computeStackLayout(direction, children, childRatios)
    setAspect(newAspect)
    setSizes(newSizes)
  }, [aspect, children, childRatios])

  // bail if layout not ready
  if (sizes == null) return null

  // get cumulative positions
  const bound = cumsum(sizes)

  // render elements
  return <Group rect={rect} updateChildRatio={setChildRatio} {...props}>
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

function Rect({ radius, id, rect, aspect, coords, ...props }) {
  useValueContext(id, aspect)
  let [ x, y, w, h ] = rectBox(rect)
  if (w < 0) { x += w; w = -w }
  if (h < 0) { y += h; h = -h }
  return <rect x={x} y={y} width={w} height={h} rx={radius} {...props} />
}

function Square({ id, rect, aspect, coords, ...props }) {
  useValueContext(id, 1)
  const [ x, y, w, h ] = rectBox(rect)
  const s = min(w, h)
  return <rect x={x} y={y} width={s} height={s} {...props} />
}

function Ellipse({ id, rect, aspect, coords, ...props }) {
  useValueContext(id, aspect)
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ id, rect, aspect, coords, ...props }) {
  useValueContext(id, 1)
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  const r = min(rx, ry)
  return <circle cx={cx} cy={cy} r={r} {...props} />
}

//
// lines
//

function Line({ p1, p2, id, rect, aspect, coords, ...props }) {
  useValueContext(id, aspect)
  const [ x1, y1 ] = pointMap(rect, p1, { coords })
  const [ x2, y2 ] = pointMap(rect, p2, { coords })
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...props} />
}

function pointString(prect, coords, points) {
  return points
    .map(p => pointMap(prect, p, { coords }))
    .map(([px, py]) => `${px},${py}`)
    .join(' ')
}

function Polyline({ points, id, rect, aspect, coords, ...props }) {
  useValueContext(id, aspect)
  const pstring = pointString(rect, coords, points)
  return <polyline points={pstring} {...props} />
}

function Polygon({ points, id, rect, aspect, coords, ...props }) {
  useValueContext(id, aspect)
  const pstring = pointString(rect, coords, points)
  return <polygon points={pstring} {...props} />
}

function UnitLine({ direction, pos = 0.5, lim = DEFAULT_LIM, id, rect, aspect, coords, ...props }) {
  useValueContext(id, aspect)
  const posdir = invertDirection(direction)
  const pz = positionMap(posdir, rect, pos, { coords })
  const [ plo, phi ] = limitMap(direction, rect, lim, { coords })
  const [ x1, y1, x2, y2 ] = direction == "horizontal" ?
        [ plo, pz, phi, pz ] : [ pz, plo, pz, phi ]
  return <line x1={x1} y1={y1} x2={x2} y2={y2} {...props} />
}

function HLine(props) {
  return <UnitLine direction="horizontal" {...props} />
}

function VLine(props) {
  return <UnitLine direction="vertical" {...props} />
}

//
// text
//

function Text({
  color = "black", fontFamily = DEFAULT_FONT_FAMILY, fontWeight = DEFAULT_FONT_WEIGHT,
  fontSize = DEFAULT_FONT_SIZE, id, children, rect, ...props
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

function TextBox({ children, padding = 0.05, border = 1, ...props }) {
  const [ text_props, props1 ] = extractPrefix('text', props)
  return <Frame padding={padding} border={border} {...props1}>
    <Text {...text_props}>{children}</Text>
  </Frame>
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

function Symline({ fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polyline points={points} {...props} />
}

function Sympoly({ fx, fy, xlim = DEFAULT_LIM, ylim = DEFAULT_LIM, tlim = DEFAULT_LIM, N = DEFAULT_N, ...props}) {
  const points = sympath({ fx, fy, xlim, ylim, tlim, N })
  return <Polygon points={points} {...props} />
}

//
// plotting
//

function Graph({ id, children, aspect, xlim, ylim, coords, ...props}) {
  useValueContext(id, aspect)

  // get declared limits of children
  const xlims = extractProperty(children, 'xlim')
  const ylims = extractProperty(children, 'ylim')
  const xlim0 = outerLim(xlims.filter(notNull)) ?? DEFAULT_LIM
  const ylim0 = outerLim(ylims.filter(notNull)) ?? DEFAULT_LIM

  // resolve eventual limits
  const [ xlo, xhi ] = xlim ?? xlim0
  const [ ylo, yhi ] = ylim ?? ylim0
  const [ cx1, cy1, cx2, cy2 ] = coords ?? [ xlo, ylo, xhi, yhi ]
  const coords1 = [ cx1, cy2, cx2, cy1 ] // NOTE: inverted y-axis!

  // plot all children
  return <Group {...props}>
    {mapChildren(children, child => {
      return cloneElement(child, { coords: coords1 })
    })}
  </Group>
}

//
// axis components
//

function Ruler({ direction, lines, coords = DEFAULT_COORDS, ...props }) {
  // handle evenly spaced lines
  if (isNumber(lines)) {
    const [ x1, y1, x2, y2 ] = coords
    const [ lo, hi ] = direction == "horizontal" ? [ x1, x2 ] : [ y1, y2 ]
    lines = linspace(lo, hi, lines)
  }

  // render line grid
  return <Group coords={coords} {...props}>
    {lines.map(pos => <UnitLine direction={direction} pos={pos} />)}
  </Group>
}

function HRuler({ lines, ...props }) {
  return <Ruler direction="vertical" lines={lines} {...props} />
}

function VRuler({ lines, ...props }) {
  return <Ruler direction="horizontal" lines={lines} {...props} />
}

//
// exports
//

export default {
  Group, Svg, Frame, Stack, HStack, VStack, Spacer, Rect, Square, Ellipse, Circle, Line, Polyline, Polygon, UnitLine, HLine, VLine, Text, TextBox, Symline, Sympoly, HRuler, VRuler, Graph
}
