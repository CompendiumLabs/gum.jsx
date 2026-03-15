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
const pivotY = 0.08
const rodLen = 0.7

// Angle of pendulum
const angle = 25 * d2r
const angleDeg = angle * r2d
const bobR = 0.075
const arcR = 0.25

// Bob position
const bobX = pivotX + rodLen * sin(angle)
const bobY = pivotY + rodLen * cos(angle)
const eqEndY = pivotY + rodLen

// Tension arrow direction (along rod, toward pivot)
const tEndX = pivotX + 0.75 * rodLen * sin(angle)
const tEndY = pivotY + 0.75 * rodLen * cos(angle)

// Midpoint of rod for length label
const midRodX = (pivotX + bobX) / 2
const midRodY = (pivotY + bobY) / 2

return <Box margin={0.06}>
  <VStack spacing={0.05}>
    {/* Title */}
    <Text stack-size={0.1}>Simple Pendulum</Text>

    {/* Diagram */}
    <Frame rounded={0.025} fill={cream} clip border={2}><Group aspect={1.25}>
      {/* Mesh background */}
      <Mesh2D xlocs={25} ylocs={20} stroke={navy} stroke-opacity={0.05} />

      {/* Ceiling / support */}
      <RoundedRect pos={[0.5, 0]} rad={[0.3, 0.08]} fill={sand} stroke={navy} stroke-width={1.5} rounded={0.1} />

      {/* Angle arc */}
      <Arc pos={[pivotX, pivotY]} rad={arcR} degrees={[90, 90 - angleDeg]} stroke={dustyRose} stroke-width={2} />
      <Latex pos={[pivotX + 0.04, pivotY + 0.18]} yrad={0.05} color={dustyRose}>\theta</Latex>

      {/* Dashed equilibrium line */}
      <Line stroke={steel} stroke-width={2} stroke-dasharray={4} points={[[pivotX, pivotY], [pivotX, eqEndY]]} />
      <Dot pos={[pivotX, eqEndY]} rad={0.01} color={steel} stroke-width={2}/>

      {/* Rod */}
      <Line stroke={navy} stroke-width={2.5} points={[[pivotX, pivotY], [bobX, bobY]]} />

      {/* Pivot point */}
      <Circle pos={[pivotX, pivotY]} rad={0.01} fill={slate} stroke={navy} stroke-width={1.5} />

      {/* Tension arrow */}
      <Arrow points={[[bobX, bobY], [tEndX, tEndY]]} stroke={sage} stroke-width={2} arrow-fill={sage} arrow-size={0.04} />
      <Latex pos={[tEndX + 0.06, tEndY + 0.01]} yrad={0.05} color={sage}>T</Latex>

      {/* Gravity arrow */}
      <Arrow points={[[bobX, bobY], [bobX, bobY + bobR + 0.13]]} stroke={dustyRose} stroke-width={2} arrow-fill={dustyRose} arrow-size={0.03} />
      <Latex pos={[bobX + 0.09, bobY + bobR + 0.1]} yrad={0.05} color={dustyRose}>mg</Latex>

      {/* Bob */}
      <Frame aspect={1} pos={[bobX, bobY]} rad={bobR} padding={0.5} fill={sage} stroke={navy}border={2} shape={<Circle />}>
        <Latex>m</Latex>
      </Frame>

      {/* Length label */}
      <Latex pos={[midRodX - 0.02, midRodY + 0.06]} yrad={0.05} color={navy}>\ell</Latex>
    </Group></Frame>

    {/* Equation of motion */}
    <Latex stack-size={0.1}>{"\\ddot{\\theta} + \\frac{g}{\\ell}\\sin(\\theta) \\approx 0"}</Latex>
  </VStack>
</Box>
