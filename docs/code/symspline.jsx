// smooth damped oscillation using sparse sampling (N=8)
// shows how spline interpolates between discrete function samples
const decay = x => 2 * exp(-x/2) * sin(3*x)

return <Plot xlim={[0, 2*pi]} ylim={[-1, 1]} aspect={phi} margin={0.15} grid>
  <SymSpline fy={decay} N={8} stroke={blue} stroke-width={2} />
  <SymPoints fy={decay} N={8} size={0.05} fill={red} />
</Plot>
