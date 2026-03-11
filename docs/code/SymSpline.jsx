// smooth damped oscillation using sparse sampling (N=10)
// shows how spline interpolates between discrete function samples
// display the true function in gray with low opacity
const decay = x => exp(-x/2) * sin(3*x)

return <Plot xlim={[0, 2*pi]} ylim={[-1, 1]} grid margin={0.15} aspect={phi}>
  <SymLine fy={decay} opacity={0.25} N={200} />
  <SymSpline fy={decay} N={10} stroke={blue} stroke-width={2} />
  <SymPoints fy={decay} N={10} size={0.05} fill={red} />
</Plot>
