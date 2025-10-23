// Circles spiraling outwards. They have black borders and semi-transparent fills. They are tinted blue at the outside and red towards the inside. They are framed by a circle with a black border and a gray background.
const freq = 38 * pi
const pal = palette(red, blue)
const fx = t => (t/freq) * cos(t)
const fy = t => (t/freq) * sin(t)
return <Graph xlim={[-1.1, 1.1]} ylim={[-1.1, 1.1]}>
  <Circle pos={[0, 0]} rad={1} fill="#eee" />
  <DataPoints fx={fx} fy={fy} tlim={[0, freq]} N={100} size={0.05}>
    { (x, y, t, i) => <Circle fill={pal(t/freq)} opacity={0.75} /> }
  </DataPoints>
</Graph>
