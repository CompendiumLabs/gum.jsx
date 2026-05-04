// a city-block route in blue with rounded corners, with the underlying
// vertices marked as black dots to show how the corners are rounded
const points = [
  [0.10, 0.20],
  [0.40, 0.20],
  [0.40, 0.80],
  [0.70, 0.80],
  [0.70, 0.50],
  [0.90, 0.50],
]
return <Frame margin>
  <Line opacity={0.3} points={points} />
  <RoundedLine stroke={blue} stroke-width={2} radius={0.08} points={points} />
  <Points point-size={0.015} points={points} />
</Frame>
