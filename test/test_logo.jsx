const colors = {
  bg: '#2B221E',      // Espresso
  rust: '#BC5D2E',    // Terracotta
  mustard: '#DBA858', // Retro Gold
  teal: '#4E6E66',    // Muted Teal
  cream: '#EFE5D5',   // Off-white
  shadow: '#00000033' // Transparent black
}

const Star = ({ pos, rad, fill }) => (
  <Polygon pos={pos} rad={rad} fill={fill}>{[
    [0, -1], [0.2, -0.2], [1, 0], [0.2, 0.2],
    [0, 1], [-0.2, 0.2], [-1, 0], [-0.2, -0.2]
  ]}</Polygon>
)

return <Frame fill={colors.bg} padding={0.2} margin rounded>
  {/* Decorative Atomic Star */}
  <Star pos={[0.9, 0.15]} rad={0.04} fill={colors.mustard} />

  {/* Background Sun/Planet Geometry */}
  <Group clip={<Circle />}>
    <Rect fill={colors.mustard} />
    <Rect pos={[0.5, 0.75]} rad={[0.5, 0.25]} fill={colors.teal} />
    {linspace(0.6, 0.8, 3).map(y =>
      <Rect pos={[0.5, y]} rad={[0.5, 0.02]} fill={colors.bg} opacity={0.2} />
    )}
    <Circle stroke-width={2} />
  </Group>

  {/* The Thermos Icon */}
  <Group rad={[0.12, 0.32]}>
    {/* Shadow */}
    <Rect pos={[0.58, 0.53]} rounded={0.12} fill={colors.shadow} />

    {/* Body */}
    <Rect rounded={0.12} fill={colors.rust} />

    {/* Cup/Cap */}
    <Rect pos={[0.5, 0.05]} rad={[0.52, 0.1]} rounded fill={colors.cream} />
    <Rect pos={[0.5, 0.13]} rad={[0.42, 0.02]} rounded fill={colors.bg} opacity={0.1} />

    {/* Ribs (Grip Lines) */}
    {linspace(0.325, 0.775, 5).map(y =>
      <Rect pos={[0.5, y]} rad={[0.5, 0.025]} fill={colors.bg} opacity={0.15} />
    )}

    {/* Reflection Line */}
    <Rect pos={[0.25, 0.55]} rad={[0.04, 0.3]} rounded fill={colors.cream} opacity={0.4} />
  </Group>

  {/* Decorative Atomic Star */}
  <Star pos={[0.2, 0.25]} rad={0.07} fill={colors.cream} />
</Frame>
