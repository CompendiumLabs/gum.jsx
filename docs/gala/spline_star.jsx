// parameters
const n = 5
const R = 0.7
const c = 0.6

// get inner/outer vertex angles
const theta0 = linspace(0, 2 * pi, n + 1).slice(0, -1).map(t => t - pi / 2)
const theta1 = theta0.map(t => t + pi / n)

// get inner/outer point positions
const polar = (r, t) => [ r * cos(t), r * sin(t) ]
const points0 = theta0.map(t => polar(1, t))
const points1 = theta1.map(t => polar(R, t))

// return full spline
return <Frame aspect margin padding rounded fill={gray}>
  <Spline closed fill={blue} curve={c} coord={[-1, -1, 1, 1]}>
    {zip(points0, points1).flat()}
  </Spline>
</Frame>
