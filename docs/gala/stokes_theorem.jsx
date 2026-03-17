// Stokes' Theorem Diagram

const boundary = [
  [0.08, 0.66], [0.12, 0.46], [0.22, 0.30],
  [0.40, 0.20], [0.58, 0.18], [0.76, 0.26],
  [0.88, 0.44], [0.86, 0.64], [0.76, 0.76],
  [0.58, 0.84], [0.36, 0.84], [0.14, 0.76],
]

const meshH1 = [[0.17, 0.46], [0.36, 0.36], [0.53, 0.33], [0.70, 0.35], [0.84, 0.46]]
const meshH2 = [[0.18, 0.62], [0.38, 0.54], [0.54, 0.50], [0.70, 0.52], [0.85, 0.58]]
const meshV1 = [[0.28, 0.31], [0.30, 0.44], [0.32, 0.58], [0.30, 0.80]]
const meshV2 = [[0.50, 0.22], [0.51, 0.38], [0.53, 0.54], [0.52, 0.80]]
const meshV3 = [[0.72, 0.30], [0.72, 0.42], [0.73, 0.56], [0.72, 0.76]]

const normals = [
  [[0.30, 0.44], [0.26, 0.26]],
  [[0.53, 0.38], [0.50, 0.18]],
  [[0.72, 0.42], [0.69, 0.24]],
  [[0.40, 0.58], [0.37, 0.42]],
  [[0.63, 0.54], [0.60, 0.36]],
]

const tangents = [
  [[0.12, 0.46], [0.2, 0.25]],
  [[0.40, 0.20], [0.6, 0.15]],
  [[0.82, 0.30], [1.02, 0.80]],
  [[0.86, 0.64], [0.61, 1.04]],
  [[0.58, 0.84], [0.23, 0.79]],
  [[0.14, 0.76], [0.01, 0.21]],
]

const SurfaceDiagram = (attr) =>
  <Group aspect={1.05} {...attr}>
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
    <Latex pos={[0.48, 0.52]} yrad={0.055} color="#9c27b0" stroke={none} font-weight={700}>S</Latex>
    <Latex pos={[0.02, 0.52]} yrad={0.035} color={blue} stroke={none} font-weight={700}>\delta S</Latex>
    <Latex pos={[0.40, 0.10]} yrad={0.035} color={purple} font-weight={700}>{"\\hat{n}"}</Latex>
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
