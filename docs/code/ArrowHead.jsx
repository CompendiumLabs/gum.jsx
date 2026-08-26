// arrowheads on a shaft: the default open head, a wider bowed one, a filled one, and a harpoon with just the left barb
const heads = [
  { arc: 75 },
  { arc: 90, curve: 0.7 },
  { arc: 60, fill: blue },
  { arc: 90, curve: 0.7, barb: 'left' },
]
return <HStack spacing={0.1}>
  {heads.map(h => <Group aspect={1}>
    <Line points={[[0.15, 0.5], [0.8, 0.5]]} stroke-width={2} />
    <ArrowHead pos={[0.8, 0.5]} size={0.3} stroke-width={2} {...h} />
  </Group>)}
</HStack>
