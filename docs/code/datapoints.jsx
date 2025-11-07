// A plot of a sine wave in blue. There are white pill shaped line markers along the sine wave that are rotated to follow the slope of the curve.
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} fill grid clip margin={[0.25, 0.1]}>
  <DataPath fy={sin} stroke={blue} stroke-width={2} />
  <DataPoints fy={sin} size={0.125} N={11}>
    { (x, y) => <Rect fill={white} rounded={0.3} aspect={2} spin={-r2d*atan(cos(x))} /> }
  </DataPoints>
</Plot>
