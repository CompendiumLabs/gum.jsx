// A slide with a title, a plot of a sine wave, and some text describing the plot. Let the title be "The Art of the Sine Wave".
<Slide title="The Art of the Sine Wave">
  <Text>Here's a plot of a sine wave below. It has to be the right size to fit in with the figure correctly.</Text>
  <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid fill={gray} margin={[0.25, 0.05]}>
    <SymLine fy={sin} stroke={blue} stroke-width={2} />
  </Plot>
  <Text>It ranges from low to high and has some extra vertical space to allow us to see the full curve.</Text>
</Slide>
