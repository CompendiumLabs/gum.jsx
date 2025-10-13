<Slide title="On Sine Waves">
  Here's a plot of a sine wave below. It has to be the right size to fit in with the figure correctly.

  <Plot stack-size={0.6} stack-expand={false} grid ylim={[-1.5, 1.5]} fill="#f6f6f6">
    <SymPath fy={sin} xlim={[0, 2*pi]} stroke={blue} stroke-width={2} />
    <SymPoints fy={sin} xlim={[0, 2*pi]} N={10} size={0.06} fill={white} />
  </Plot>

  It ranges from low to high and has some extra vertical space to allow us to see the full curve.
</Slide>
