const pal = palette(blue, purple, [3, 8])
const shapes = [ [3, 'Triangle'], [4, 'Square'], [5, 'Pentagon'], [6, 'Hexagon'], [7, 'Heptagon'], [8, 'Octagon'] ]

function RegularPolygon({ n, color }) {
  const tvals = linspace(0, 2*pi, n+1)
  const fx = t => cos(t - pi/2)
  const fy = t => sin(t - pi/2)
  return <DataPoly aspect fx={fx} fy={fy} tvals={tvals} xlim={[-1, 1]} ylim={[-1, 1]} fill={color} />
}

return <Slide title="Simple Regular Polygons" wrap={23}>
  <Text>A regular polygon has equal side lengths and equal interior angles. Below are examples for <Latex>{"n \\in \\{3, \\ldots, 8\\}"}</Latex></Text>
  <Grid rows={2} spacing={[0.05, 0.075]}>
    { shapes.map(([n, s]) =>
      <Frame rounded fill padding aspect>
        <VStack spacing>
          <RegularPolygon stack-size={0.8} n={n} color={pal(n)} />
          <Text stack-size={0.2}>{`${s} (${n})`}</Text>
        </VStack>
      </Frame>
    ) }
  </Grid>
</Slide>
