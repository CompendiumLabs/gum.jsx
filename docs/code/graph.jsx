// a series of closely spaced squares rotating clockwise along a sinusoidal path
<Graph padding={[0.2, 0.6]}>
  <SymPoints
    fy={sin} xlim={[0, 2*pi]} size={0.5} N={150}
    shape={x => <Square rounded spin={r2d*x} />}
  />
</Graph>
