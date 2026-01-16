// A plot of a sine wave in blue. There are white pill shaped line markers along the sine wave that are rotated to follow the slope of the curve.
const Pill = args => <Rect fill={white} rounded={0.3} aspect={2} {...args} />
return <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid fill={lightgray} margin={[0.25, 0.1]} aspect="auto">
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
  <SymPoints fy={sin} size={0.125} N={11} shape={x => <Pill spin={-r2d*atan(cos(x))}/>} />
</Plot>
