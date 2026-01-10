const aspect = 2
const ratio = pi / aspect
return <Box margin={0.3}>
  <Group coord={[0, 1, 2*pi, -1]} aspect={aspect}>
    <HMesh locs={5} lim={[0, 2*pi]} opacity={0.3} />
    <VMesh locs={5} lim={[-1, 1]} opacity={0.3} />
    <HAxis ticks={5} lim={[0, 2*pi]} pos={[pi, -1]} rad={[pi, 0.04]} />
    <VAxis ticks={5} lim={[-1, 1]} pos={[0, 0]} rad={[0.04*ratio, 1]} />
    <SymCurve fy={sin} xlim={[0, 2*pi]} />
  </Group>
</Box>
