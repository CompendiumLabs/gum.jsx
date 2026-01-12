<Frame border={2} rounded={0.02} clip margin>
  <Plot
    aspect={1.5} xlim={[-4*pi, 4*pi]} ylim={[-1.5, 1.5]}
    grid xticks={31} yticks={21} axis-stroke-width={0}
  >
    { linspace(0, pi, 10).map(p =>
      <SymLine
        fy={x => cos(x-p) * exp(-0.05*x*x)}
        stroke={interp(red, blue, p/pi)}
        stroke-width={2} N={250}
      />
    )}
  </Plot>
</Frame>
