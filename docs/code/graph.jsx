// a series of closely spaced squares rotating clockwise along a sinusoidal path
<Graph padding={0.2}>
  <DataPoints fy={sin} size={0.5} xlim={[0, 2*pi]} N={150}>
    { x => <Square spin={r2d*x} /> }
  </DataPoints>
</Graph>
