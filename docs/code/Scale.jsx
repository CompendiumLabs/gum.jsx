// a horizontal scale with five full-height ticks, and a vertical one with
// short blue ticks at chosen locations
<HStack spacing={0.1}>
  <Frame aspect={2} margin={0.1}>
    <HScale locs={5} />
  </Frame>
  <Frame aspect={2} margin={0.1}>
    <VScale locs={[0.15, 0.35, 0.5, 0.8]} span={[0.4, 0.6]} stroke={blue} stroke-width={2} />
  </Frame>
</HStack>
