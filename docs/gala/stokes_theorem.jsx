// Stokes' Theorem Diagram

const surface = {
  center: [0.48, 0.52],
  basisX: [0.39, 0],
  basisY: [0.06, 0.29],
  basisZ: [0.03, -0.22],
  boundaryCount: 18,
  meshH: [ -0.35, 0.28 ],
  meshV: [ -0.52, 0, 0.48 ],
  tangentCount: 6,
  tangentPhase: 0.58,
  tangentLength: 0.2,
  normals: [
    [-0.45, -0.02],
    [-0.1, -0.22],
    [0.32, 0.42],
    [-0.32, 0.54],
    [0.26, 0.08],
  ],
  normalLength: 0.15,
}

const add3 = ([ax, ay, az], [bx, by, bz]) => [ax + bx, ay + by, az + bz]
const scale3 = ([x, y, z], s) => [s * x, s * y, s * z]
const cross3 = ([ax, ay, az], [bx, by, bz]) => [
  ay * bz - az * by,
  az * bx - ax * bz,
  ax * by - ay * bx,
]

const project_vec = ([x, y, z]) =>
  add2(
    mul2(surface.basisX, x),
    add2(mul2(surface.basisY, y), mul2(surface.basisZ, z))
  )

const project = (point) => add2(surface.center, project_vec(point))

const surface_point = (u, v) => {
  const x = u + 0.09 * u * v - 0.05 * v * v
  const y = v + 0.05 * u - 0.06 * u * u + 0.03 * v * v
  const z = 0.5 - 0.24 * u * u - 0.46 * v * v + 0.08 * u - 0.05 * v + 0.08 * u * v
  return [x, y, z]
}

const surface_du = (u, v) => [
  1 + 0.09 * v,
  0.05 - 0.12 * u,
  -0.48 * u + 0.08 + 0.08 * v,
]

const surface_dv = (u, v) => [
  0.09 * u,
  1 + 0.06 * v,
  -0.92 * v - 0.05 + 0.08 * u,
]

const boundary_sample = (t) => project(surface_point(cos(t), sin(t)))

const boundary_tangent = (t) => {
  const [u, v] = [cos(t), sin(t)]
  return project_vec(
    add3(
      scale3(surface_du(u, v), -sin(t)),
      scale3(surface_dv(u, v), cos(t))
    )
  )
}

const iso_u = (u0, n = 4) => {
  const span = sqrt(1 - u0 * u0)
  return linspace(-span, span, n).map(v => project(surface_point(u0, v)))
}

const iso_v = (v0, n = 5) => {
  const span = sqrt(1 - v0 * v0)
  return linspace(-span, span, n).map(u => project(surface_point(u, v0)))
}

const tangent_arrow = (turn, length) => {
  const t = 2 * pi * turn
  const start = boundary_sample(t)
  const delta = normalize(boundary_tangent(t), 2)
  const end = add2(start, mul2(delta, length))
  return [start, end]
}

const normal_arrow = (u, v, length) => {
  const base = project(surface_point(u, v))
  const normal = project_vec(cross3(surface_du(u, v), surface_dv(u, v)))
  const delta = normalize(normal[1] > 0 ? mul2(normal, -1) : normal, 2)
  const tip = add2(base, mul2(delta, length))
  return [base, tip]
}

const boundary = linspace(0, 2 * pi, surface.boundaryCount, false).map(boundary_sample)
const [ meshH1, meshH2 ] = surface.meshH.map(v => iso_v(v, 5))
const [ meshV1, meshV2, meshV3 ] = surface.meshV.map(u => iso_u(u, 4))
const normals = surface.normals.map(([u, v]) => normal_arrow(u, v, surface.normalLength))
const tangents = linspace(0, 1, surface.tangentCount, false).map(i => tangent_arrow(i, surface.tangentLength))

const SurfaceDiagram = (attr) =>
  <Group aspect={1} {...attr}>
    <Spline closed points={boundary} stroke={blue} stroke-width={2.5} fill="#eeddf7" fill-opacity={0.7} curve={0.5} />
    {[ meshH1, meshH2, meshV1, meshV2, meshV3 ].map(points =>
      <Spline points={points} stroke="#caa0d8" stroke-dasharray={3} />
    )}
    {tangents.map(([start, end]) =>
      <Arrow points={[start, end]} fill={blue} stroke={blue} stroke-width={2} arrow-size={0.04} />
    )}
    {normals.map(([base, tip]) =>
      <Arrow points={[base, tip]} fill={purple} stroke={purple} stroke-width={2}/>
    )}
    <Latex pos={[0.48, 0.5]} yrad={0.055} color="#9c27b0" stroke={none} font-weight={700}>S</Latex>
    <Latex pos={[0, 0.55]} yrad={0.035} color={blue} stroke={none} font-weight={700}>\delta S</Latex>
    <Latex pos={[0.56, 0.17]} yrad={0.035} color={purple} font-weight={700}>{"\\hat{n}"}</Latex>
  </Group>

const MathPanel = (attr) =>
  <VStack spacing={0.2} justify="left" {...attr}>
    <Frame padding={0.15} rounded={0.05} fill="#f8f4fc" border-stroke="#d0b8e0">
      <Latex>{"\\oint_{\\partial S} F \\cdot dr = \\iint_{S} (\\nabla \\times F) \\cdot dS"}</Latex>
    </Frame>
    <Text wrap={16} spacing={0.25}>The line integral of a vector field <Latex>F</Latex> around the closed boundary curve <Latex>\delta S</Latex> equals the surface integral of the curl of <Latex>F</Latex> over any oriented surface <Latex>S</Latex> bounded by that curve.</Text>
  </VStack>

return <TitleFrame title="Stokes' Theorem" title-size={0.075} margin padding={0.15} rounded={0.025}>
  <HStack spacing={0.05}>
    <SurfaceDiagram />
    <MathPanel />
  </HStack>
</TitleFrame>
