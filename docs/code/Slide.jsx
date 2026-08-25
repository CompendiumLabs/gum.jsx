// A slide titled "The Art of the Sine Wave" with a short paragraph, a plot of a sine wave, and two bullet points about it.
<Slide title="The Art of the Sine Wave">
  <Text>Here's a plot of a sine wave. It has to be the right size to fit in with the text correctly.</Text>
  <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid fill={lightgray} margin={[0.25, 0.05]} aspect={3}>
    <SymLine fy={sin} stroke={blue} stroke-width={2} />
  </Plot>
  <Bullets>
    <Text>It ranges from low to high</Text>
    <Text>The extra vertical space shows the full curve</Text>
  </Bullets>
</Slide>
