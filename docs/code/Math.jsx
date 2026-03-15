// use polar to place points around a circle
const center = [0.5, 0.5]
const ring = range(10).map(i => {
  const radius = i % 2 == 0 ? 0.32 : 0.16
  return polar([radius, -90 + 36 * i], center)
})
const spokes = range(5).map(i => polar([0.32, -90 + 72 * i], center))

return <Group>
  <Circle pos={center} rad={0.32} stroke={gray} />
  <Shape points={ring} stroke={blue} stroke-width={2} />
  {spokes.map(pos => <Line points={[center, pos]} stroke={red} stroke-width={1.5} />)}
  {ring.map(pos => <Dot pos={pos} rad={0.015} fill={blue} />)}
</Group>
