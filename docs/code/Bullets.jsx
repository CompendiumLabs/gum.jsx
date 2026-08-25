// A bulleted list of three points about layout, with a nested sub-list under the second point, all wrapped to 22 ems and framed with padding.
<Frame padding rounded>
  <Bullets wrap={22}>
    <Text>Positions and sizes are proportional to the parent</Text>
    <Text>Layout containers arrange their children</Text>
    <Bullets>
      <Text>Stacks place elements along one axis</Text>
      <Text>Grids place elements along two</Text>
    </Bullets>
    <Text>Text is measured with real font metrics</Text>
  </Bullets>
</Frame>
