// a decaying sine wave filled in with blue
const decay = x => exp(-0.1*x) * sin(x)
return <Graph xlim={[0, 6*pi]} ylim={[-1, 1]} aspect={phi}>
  <SymFill fy1={decay} fy2={0} fill={blue} fill-opacity={0.5} N={250} />
  <SymCurve fy={decay} N={250} />
</Graph>
