// a horizontal axis with 5 ticks labeled with emojis for: mount fuji, a rocket, a whale, a watermellon, and a donut
const emoji = ['A', 'B', 'C', 'D', 'E']
const ticks = zip(linspace(0, 1, emoji.length), emoji)
return <Box margin={0.6}>
  <HAxis ticks={ticks} aspect={15} />
</Box>
