<Frame border={2} rounded={0.02} clip margin>
  <Plot
    aspect={1.5} axis={false} xgrid={31} ygrid={21}
    xlim={[-4*pi, 4*pi]} ylim={[-1.5, 1.5]}
  >
    { linspace(0, pi, 10).map(p =>
      <SymSpline
        fy={x => cos(x-p) * exp(-0.05*x*x)}
        stroke={interp(red, blue, p/pi)}
        stroke-width={2} N={50}
      />
    )}
  </Plot>
</Frame>
