// A vector field showing a function with gradient 100 * x * y. There should be a grid of 15 by 15 arrows. The stroke width should be 2.
<Frame rounded={0.02} margin padding={0.075} border={2} fill>
  <SymField func={(x, y) => 100 * x * y} xlim={[0, 1]} ylim={[0, 1]} N={15} stroke-width={2} />
</Frame>
