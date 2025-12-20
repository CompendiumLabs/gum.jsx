<Slide title="Sine Wave Basics" title-fill="#333" title-text-color={white} title-border-stroke={white}>
  <Text color={white}>Definition: The function sin(x) gives the y-coordinate of a point on the unit circle at angle x (radians).</Text>
  <Plot margin={[0.3, 0.05]} aspect={2} xlim={[0, 2*pi]} ylim={[-1.2, 1.2]} xanchor={0} xaxis-tick-side="both" xticks={[[0.5*pi, "π/2"], [pi, "π"], [1.5*pi, "3π/2"], [2*pi, "2π"]]} axis-stroke={white} axis-label-color={white} grid grid-stroke={white} border border-stroke={white} border-opacity={0.3}>
    <DataPath fy={sin} stroke={blue} stroke-width={3} />
  </Plot>
  <Text color={white}>At any given point, the slope is simply cos(x). It has extrema at π/2 and 3π/2.</Text>
</Slide>
