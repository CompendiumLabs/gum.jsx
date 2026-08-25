// Graph flips its y axis so higher is up, but compound elements (math, text,
// and layout containers) are upright by default: they are placed in the
// flipped coord while their insides stay top-down. Point geometry (the Line)
// still sees the flipped coord, so its [0, 0] -> [1, 1] runs up and right
<Graph aspect={2} xlim={[0, 10]} ylim={[0, 10]}>
  <Latex pos={[2, 7]} rad={[1.5, 1]}>x^2</Latex>
  <Text pos={[6, 7]} rad={[2, 1.5]} wrap={5}>first second third fourth</Text>
  <VStack pos={[2, 3]} rad={[1.5, 1.5]}>
    <Text>one</Text>
    <Text>two</Text>
  </VStack>
  <Frame pos={[6, 3]} rad={[1.5, 1.5]} padding rounded><Latex>y^2</Latex></Frame>
  <Line pos={[8.5, 3]} rad={1} points={[[0, 0], [1, 1]]} />
</Graph>
