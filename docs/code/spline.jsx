// draw a blue cubic spline path that looks like a backwards G, using 5 vertices. label the vertices with black dots and connect them with straight red lines. place the whole thing in a rounded frame.
const points = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.75, 0.75],
  [0.25, 0.75],
  [0.50, 0.50],
]
return <Frame rounded margin aspect={1}>
  <Spline stroke={blue}>{points}</Spline>
  <Curve stroke={red}>{points}</Curve>
  <Points size={0.0075}>{points}</Points>
</Frame>
