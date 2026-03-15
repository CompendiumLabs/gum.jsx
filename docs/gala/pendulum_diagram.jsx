// Pendulum Diagram — stately, muted palette
const slate = '#4a5568'
const steel = '#718096'
const sand = '#c4b5a0'
const cream = '#f5f0e8'
const navy = '#2d3748'
const dustyRose = '#9e6060'
const sage = '#5a8a6e'

// Geometry
const pivotX = 0.5
const pivotY = 0.10
const angle = 25 * d2r
const rodLen = 0.7
const bobX = pivotX + rodLen * sin(angle)
const bobY = pivotY + rodLen * cos(angle)
const bobR = 0.075

// Arc for angle indicator
const arcR = 0.14
const arcPoints = linspace(0, angle, 30).map(a => [pivotX + arcR * sin(a), pivotY + arcR * cos(a)])

// Dashed equilibrium line
const eqEndY = pivotY + rodLen + 0.06

// Tension arrow direction (along rod, toward pivot)
const dx = pivotX - bobX
const dy = pivotY - bobY
const mag = sqrt(dx*dx + dy*dy)
const nx = dx / mag
const ny = dy / mag
const tStartX = bobX + nx * (bobR + 0.015)
const tStartY = bobY + ny * (bobR + 0.015)
const tEndX = tStartX + nx * 0.10
const tEndY = tStartY + ny * 0.10

// Midpoint of rod for length label (offset to the left of the rod)
const midRodX = (pivotX + bobX) / 2 - 0.075
const midRodY = (pivotY + bobY) / 2 + 0.1

const BobCircle = () =>
  <Circle fill={sage} stroke={navy} stroke-width={2} />
const Bob = ({ label, ...attr }) => <Frame {...attr} padding shape={<BobCircle />}>
  <Latex>{label}</Latex>
</Frame>

return <Box margin={0.06}><VStack spacing>
  {/* Title */}
  <Text pos={[0.48, 0.84]} yrad={0.025} color={navy} font-weight={400}>Simple Pendulum</Text>

  <Group aspect={1.5}>
    {/* Background */}
    <Rect fill={cream} rounded={0.025} />

    {/* Ceiling / support */}
    <Rect pos={[0.48, 0.05]} rad={[0.3, 0.05]} fill={sand} stroke={navy} stroke-width={1.5} rounded={0.008} />

    {/* Dashed equilibrium (vertical) line */}
    <Line stroke={steel} stroke-width={1} stroke-dasharray="4 3" points={[[pivotX, pivotY + 0.02], [pivotX, eqEndY]]} />

    {/* Angle arc */}
    <Line stroke={dustyRose} stroke-width={1.5} points={arcPoints} />

    {/* Angle label θ */}
    <Latex pos={[pivotX + 0.04, pivotY + 0.18]} yrad={0.05} color={dustyRose}>{"\\theta"}</Latex>

    {/* Rod */}
    <Line stroke={navy} stroke-width={2.5} points={[[pivotX, pivotY], [bobX, bobY]]} />

    {/* Pivot point */}
    <Circle pos={[pivotX, pivotY]} yrad={0.013} fill={slate} stroke={navy} stroke-width={1.5} />

    {/* Bob */}
    <Bob pos={[bobX, bobY]} rad={bobR} label="m" />

    {/* Length label: ℓ (to the left of the rod) */}
    <Latex pos={[midRodX, midRodY]} yrad={0.05} color={navy}>{"\\ell"}</Latex>

    {/* Gravity arrow (downward from bob) */}
    <Arrow points={[[bobX, bobY + bobR + 0.015], [bobX, bobY + bobR + 0.10]]} stroke={dustyRose} stroke-width={2} arrow-fill={dustyRose} arrow-size={0.02} />
    <Latex pos={[bobX + 0.055, bobY + bobR + 0.065]} yrad={0.05} color={dustyRose}>{"mg"}</Latex>

    {/* Tension arrow (along rod, toward pivot) */}
    <Arrow points={[[tStartX, tStartY], [tEndX, tEndY]]} stroke={sage} stroke-width={2} arrow-fill={sage} arrow-size={0.02} />
    <Latex pos={[tEndX + 0.045, tEndY - 0.005]} yrad={0.05} color={sage}>{"T"}</Latex>
    </Group>

    {/* Equation of motion at bottom */}
    <Latex pos={[0.48, 0.93]} yrad={0.035} color={slate}>{"\\ddot{\\theta} + \\frac{g}{\\ell}\\sin(\\theta) = 0"}</Latex>
</VStack></Box>

