// a series of closely spaced squares rotating clockwise along a sinusoidal path
<Graph ylim={[-1.5, 1.5]} padding={0.2} aspect={phi}>
  <SymPoints
    fy={sin} xlim={[0, 2*pi]} size={0.5} N={150}
    shape={x => <Square rounded spin={r2d*x} />}
  />
</Graph>
