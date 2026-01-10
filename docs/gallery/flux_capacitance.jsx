<Plot grid margin={0.3} xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} xlabel="Phase (radians)" ylabel="Interference" title="Flux Capacitance">
  <SymFill fy1={sin} fy2={cos} fill={blue} opacity={0.25} />
  <SymCurve fy={sin} />
  <SymCurve fy={cos} />
</Plot>
