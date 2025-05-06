//
// gum
//

import {
  Children, cloneElement, isValidElement, createContext, useContext, useState, useLayoutEffect, useMemo
} from 'react'

import {
  isNumber, isFunction, zip, linspace, max, min, sum, cumsum, rectBox, rectRadial, rectMap, fracShrink, pointMap, outerRect, rectAspect, calcTextAspect, DEFAULT_SIZE, DEFAULT_RECT, DEFAULT_COORDS, DEFAULT_LIM, DEFAULT_N, DEFAULT_PROP, DEFAULT_FONT_FAMILY, DEFAULT_FONT_WEIGHT, DEFAULT_FONT_SIZE
} from './utils'

//
// defaults
//

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
  return Children.map(children, (child, index) => {
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

//
// aspect ratios
//

// Create a context for aspect ratio reporting
const AspectContext = createContext();

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

// get aspect with default fallback
function getAspect(child) {
  if (!isValidElement(child)) return null
  const { props, type } = child
  const { defaultAspect } = type
  const { aspect } = props
  if (aspect != null) return aspect
  if (defaultAspect == null) return null
  if (!isFunction(defaultAspect)) return defaultAspect
  return defaultAspect(props)
}

function Group({ rect, children, coords = DEFAULT_COORDS, ...props }) {
  const [ratios, setRatios] = useState({})
  return <g {...props}>
    <AspectRatioCollector onAspectRatiosChange={setRatios}>
      {mapChildren(children, child => {
        const { id, rect: crect = DEFAULT_RECT } = child.props
        const { [id]: aspect } = ratios
        const rect1 = rectMap(rect, crect, { aspect, coords })
        return cloneElement(child, { rect: rect1 })
      })}
    </AspectRatioCollector>
  </g>
}

function Svg({ children, size = DEFAULT_SIZE, coords = DEFAULT_COORDS, ...props }) {
  // collect child aspect ratios
  const [ratios, setRatios] = useState(new Map())
  const api = useMemo(() => ({
    register(id, r) {
      setRatios(prev => {
        const next = new Map(prev);
        next.set(id, r);
        return next;
      });
    },
    unregister(id) {
      setRatios(prev => {
        const next = new Map(prev);
        next.delete(id);
        return next;
      });
    }
  }), []);

  const wrapped = mapChildren(children, (child) => {
    const id = child.key != null ? String(child.key) : String(Symbol("ar"));
    return cloneElement(child, { id });
  });

  const items = Object.fromEntries(mapComponents(wrapped, (child) => {
    const { id } = child.props;
    const ar = ratios.get(id); // undefined until the child registers
    return [ id, ar ];
  }))

  // compute svg bounds
  let w, h;
  if (isNumber(size)) {
    const rects = Children.toArray(children).map(child => {
      const { id, rect: crect = DEFAULT_RECT } = child.props
      const { [id]: aspect } = items
      return rectMap(DEFAULT_RECT, crect, { aspect })
    })
    const outer = outerRect(rects)
    const aspect = rectAspect(outer)
    const aspect2 = Math.sqrt(aspect)
    w = size * aspect2
    h = size / aspect2
  } else {
    [ w, h ] = size
  }

  const rect = [ 0, 0, w, h ]
  return <svg width={w} height={h} {...DEFAULT_PROP} {...props}>
    <AspectContext.Provider value={api}>
      {mapChildren(wrapped, child => {
        const { id, rect: crect = DEFAULT_RECT } = child.props
        const { [id]: aspect } = items
        const rect1 = rectMap(rect, crect, { aspect, coords })
        return cloneElement(child, { rect: rect1 })
      })}
    </AspectContext.Provider>
  </svg>
}

//
// layout components
//

function Frame({ children, aspect, padding = 0, margin = 0, border = 0, ...props }) {
  const coords = fracShrink(-padding)
  return <Group {...props}>
    <Group rect={fracShrink(margin)} coords={coords}>
      {children}
      { border > 0 && <Rect rect={coords} strokeWidth={border} /> }
    </Group>
  </Group>
}

// TODO: need to account for padding and margin
/*
Frame.defaultAspect = (props) => {
  const { children } = props
  return Children.toArray(children)
    .map(getAspect)
    .reduce((a, b) => a ?? b, null)
}
*/

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
  const { register, unregister } = useContext(AspectContext)
  useLayoutEffect(() => {
    register(id, aspect)
    return () => unregister(id)
  }, [id, aspect, register, unregister])

  let [ x, y, w, h ] = rectBox(rect)
  if (w < 0) { x += w; w = -w }
  if (h < 0) { y += h; h = -h }
  return <rect x={x} y={y} width={w} height={h} {...props} />
}

function Square({ rect, aspect, ...props }) {
  const [ x, y, w, h ] = rectBox(rect)
  const s = min(w, h)
  return <rect x={x} y={y} width={s} height={s} {...props} />
}

function Ellipse({ rect, aspect, ...props }) {
  const [ cx, cy, rx, ry ] = rectRadial(rect)
  return <ellipse cx={cx} cy={cy} rx={rx} ry={ry} {...props} />
}

function Circle({ rect, aspect, ...props }) {
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

/*
Text.defaultAspect = (props) => {
  const { children, fontFamily, fontWeight } = props
  return calcTextAspect(children, { fontFamily, fontWeight })
}
*/

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
  Group, Svg, Frame, Stack, HStack, VStack, Rect, Square, Ellipse, Circle, Line, Polyline, Polygon, Text, Symline, Sympoly, Graph
}
