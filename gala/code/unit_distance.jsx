// get coefficient bounds
const maxCoeff = 2
const coeffs = range(-maxCoeff, maxCoeff + 1)
const gridLocs = range(-4*maxCoeff, 4*maxCoeff + 1)
const deltaCoeffs = range(-1, 2)

// get bounding box for plotting
const bound0 = maxCoeff * (1 + sqrt(3))
const bound = bound0 * 1.1

// define basis vectors
const I = [0, 1]
const omega = [cos(2*pi/3), sin(2*pi/3)]
const iomega = mulc(I, omega)
const basis = [[1, 0], I, omega, iomega]

// create linear combination
function lincomb([a, b, c, d]) {
  return addc(
    addc(mulc(a, basis[0]), mulc(b, basis[1])),
    addc(mulc(c, basis[2]), mulc(d, basis[3])),
  )
}

// check if delta is a unit delta
function isUnitDelta([a, b, c, d]) {
  return b*c == a*d &&
    a*a + b*b + c*c + d*d - a*c - b*d == 1
}

// check if delta is positive (avoid double counting)
function positive([a, b, c, d]) {
  return a > 0 ||
    (a == 0 && b > 0) ||
    (a == 0 && b == 0 && c > 0) ||
    (a == 0 && b == 0 && c == 0 && d > 0)
}

// create node from coefficients
function sample(coef) {
  return { coef, pos: lincomb(coef) }
}

// create list of nodes
const nodes = coeffs.flatMap(a =>
  coeffs.flatMap(b =>
    coeffs.flatMap(c =>
      coeffs.map(d => sample([a, b, c, d]))
    )
  )
)

// make node map for quick lookup
const key = v => v.join(',')
const nodeMap = new Map(nodes.map(n => [key(n.coef), n]))

// define edge deltas
const edgeDeltas = deltaCoeffs.flatMap(a =>
  deltaCoeffs.flatMap(b =>
    deltaCoeffs.flatMap(c =>
      deltaCoeffs.map(d => [a, b, c, d])
    )
  )
).filter(isUnitDelta).filter(positive)

// build displayed edges
const edges = nodes.flatMap(n => edgeDeltas
  .map(d => nodeMap.get(key(addn(n.coef, d))))
  .filter(m => m != null)
  .map(m => [n.pos, m.pos])
)

// get resulting sizes
const n = nodes.length
const m = edges.length

// get approximate scaling
const delta = log(m) / log(n)
const delta1 = rounder(delta, 2)

// prepare data for plotting
const samples = nodes.map(n => n.pos)
const title = <Latex>{"\\mathbb{Q}(i, \\zeta_3)"}</Latex>

// plot the data
return <TitleBox border={2} rounded={0.02} clip margin title={title} title-size={0.075}>
  <Graph aspect={1} coord={[-bound, -bound, bound, bound]}>
    <Mesh2D locs={gridLocs} opacity={0.15} />
    <Segments edges={edges} stroke={blue} opacity={0.75} />
    <Points points={samples} point-size={0.075} fill={yellow} stroke-opacity={0.5} />
  </Graph>
  <Group rect={[0.025, 0.925, 0.975, 0.975]}>
    <Latex align="left">{`n = ${n}`}</Latex>
    <Latex align="right">{`\\\\nu = ${m} \\\\approx n^{${delta1}} `}</Latex>
  </Group>
</TitleBox>
