// a series of closely spaced squares rotating clockwise along a sinusoidal path
<Graph ylim={[-1.5, 1.5]} padding={0.2} aspect={2}>
  <SymPoints
    fy={sin} xlim={[0, 2*pi]} point-size={1} N={100}
    point-shape={x => <Square rounded spin={r2d*x} />}
  />
</Graph>