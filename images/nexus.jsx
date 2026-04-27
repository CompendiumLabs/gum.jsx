<Graph aspect={5} xlim={[-4*pi, 4*pi]} ylim={[-1, 1]}>
  { linspace(0, pi, 10).map(p =>
    <SymSpline
      fy={x => cos(x-p) * exp(-0.05*x*x)}
      stroke={interp(red, blue, p/pi)}
      stroke-width={2} N={50}
    />
  )}
</Graph>
