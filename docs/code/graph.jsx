// a series of closely spaced squares rotating clockwise along a sinusoidal path
<Graph padding={[0.2, 0.4]}>
  <DataPoints fy={sin} xlim={[0, 2*pi]} size={0.5} N={150}>
    { x => <Square rounded spin={r2d*x} /> }
  </DataPoints>
</Graph>
