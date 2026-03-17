// Atomic Orbital Diagram: s, p, and d

// colors
const pos_col = '#4a90d9'
const neg_col = '#e07040'
const pos_fill = '#d0e4f7'
const neg_fill = '#fce0d0'
const ax_col = '#aaaaaa'
const fill_col = '#fafafa'

// constants
const dz2_zero = atan(sqrt(2))

// --- Angular wavefunctions as radial profiles ---
// p orbital: |cos(t)|
const p_r = (t) => 0.5 * abs(cos(t))
// pz shown as diagonal projection
const pz_r = (t) => 0.5 * abs(cos(t - pi/4))
// d_xy orbital: |sin(2t)| cloverleaf
const dxy_r = (t) => 0.48 * abs(sin(2 * t))
// d_z2 orbital: 3cos²θ - 1 (split into pos/neg regions)
const dz2_r = (t) => 0.28 * abs(3 * cos(t) ** 2 - 1)
// zero crossings at θ = arccos(1/√3) ≈ 0.9553

// Plot radial orbital lobes via SymSpline
const OrbitalLobe = ({ rfn, t0, t1, sign }) =>
  <SymSpline N={50} tlim={[t0, t1]}
    fx={t => rfn(t) * cos(t)}
    fy={t => rfn(t) * sin(t)}
    stroke={sign ? pos_col : neg_col}
    fill={sign ? pos_fill : neg_fill}
    stroke-width={2} opacity={0.6}
  />

// Orbital container with Graph coordinate system
const OrbGraph = ({ children }) =>
  <Graph xlim={[-0.75, 0.75]} ylim={[-0.75, 0.75]}>
    <HLine loc={0} lim={[-0.75, 0.75]} stroke={ax_col} stroke-dasharray={4} />
    <VLine loc={0} lim={[-0.75, 0.75]} stroke={ax_col} stroke-dasharray={4} />
    {children}
    <Dot pos={[0, 0]} rad={0.02} />
  </Graph>

// S orbital
const SOrbital = () => <OrbGraph>
  <OrbitalLobe rfn={t => 0.25} t0={0} t1={2*pi} sign={true} />
</OrbGraph>

// P orbitals
const PxOrbital = () => <OrbGraph>
  <OrbitalLobe rfn={p_r} t0={-pi/2} t1={pi/2} sign={true} />
  <OrbitalLobe rfn={p_r} t0={pi/2} t1={3*pi/2} sign={false} />
</OrbGraph>

const PyOrbital = () => <OrbGraph>
  <OrbitalLobe rfn={t => p_r(t-pi/2)} t0={-pi/2} t1={pi/2} sign={true} />
  <OrbitalLobe rfn={t => p_r(t-pi/2)} t0={pi/2} t1={3*pi/2} sign={false} />
</OrbGraph>

const PzOrbital = () => <OrbGraph>
  <OrbitalLobe rfn={pz_r} t0={-pi/4} t1={pi/4 + pi/2} sign={true} />
  <OrbitalLobe rfn={pz_r} t0={pi/4 + pi/2} t1={pi/4 + 3*pi/2} sign={false} />
</OrbGraph>

// D orbitals
const DxyOrbital = () => <OrbGraph>
  <OrbitalLobe rfn={dxy_r} t0={0} t1={pi/2} sign={true} />
  <OrbitalLobe rfn={dxy_r} t0={pi} t1={3*pi/2} sign={true} />
  <OrbitalLobe rfn={dxy_r} t0={pi/2} t1={pi} sign={false} />
  <OrbitalLobe rfn={dxy_r} t0={3*pi/2} t1={2*pi} sign={false} />
</OrbGraph>

// Dz2 orbital
const Dz2Orbital = () => <OrbGraph>
  <OrbitalLobe rfn={dz2_r} t0={-dz2_zero} t1={dz2_zero} sign={true} />
  <OrbitalLobe rfn={dz2_r} t0={pi - dz2_zero} t1={pi + dz2_zero} sign={true} />
  <OrbitalLobe rfn={dz2_r} t0={dz2_zero} t1={pi - dz2_zero} sign={false} />
  <OrbitalLobe rfn={dz2_r} t0={pi + dz2_zero} t1={2*pi - dz2_zero} sign={false} />
</OrbGraph>

// Labeled orbital cell
const Cell = ({ label, children }) =>
  <VStack spacing={0.02}>
    <Frame aspect={1} border rounded fill={fill_col}>
      {children}
    </Frame>
    <Tex stack-size={0.15}>{label}</Tex>
  </VStack>

// Main slide
return <Slide title="Atomic Orbitals" title-size={0.04}>
  <VStack even spacing>
    <HStack spacing>
      <Cell label="1s"><SOrbital /></Cell>
      <Spacer aspect={1} />
      <Spacer aspect={1} />
    </HStack>
    <HStack spacing>
      <Cell label="2p_x"><PxOrbital /></Cell>
      <Cell label="2p_y"><PyOrbital /></Cell>
      <Cell label="2p_z"><PzOrbital /></Cell>
    </HStack>
    <HStack spacing>
      <Cell label="3d_{xy}"><DxyOrbital /></Cell>
      <Cell label="3d_{z^2}"><Dz2Orbital /></Cell>
      <Spacer aspect={1} />
    </HStack>
  </VStack>
</Slide>
