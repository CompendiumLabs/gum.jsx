// a series of closely spaced squares rotating clockwise along a sinusoidal path
<Graph xpad={0.2} ypad={0.4}>
  <DataPoints fy={sin} xlim={[0, 2*pi]} size={0.5} N={150}>
    { x => <Square rounded spin={r2d*x} /> }
  </DataPoints>
</Graph>
