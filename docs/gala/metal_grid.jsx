const [ n, m ] = [ 9, 16 ]
const pal = palette('#00d4ff', '#7c3aed', [0, m-1])
const pts = [
  [0.12, 0.55], [0.25, 0.20], [0.42, 0.78],
  [0.60, 0.30], [0.78, 0.72], [0.88, 0.45],
]
return <Frame border={2} rounded={0.03} fill={darkgray} padding={0.03} margin>
  <Frame rounded={0.02} fill={black} padding={0.025}>
    <Grid rows={n} cols={m} opacity={0.7}>
      {range(0, n*m).map(i => <Rect rounded={0.2} fill={pal(i%m)} /> )}
    </Grid>
    <Group stroke-linecap="round">
      <Spline curve={0.65} stroke={gray} stroke-width={15} opacity={0.25}>{pts}</Spline>
      <Spline curve={0.65} stroke={gray} stroke-width={5}>{pts}</Spline>
    </Group>
  </Frame>
</Frame>
