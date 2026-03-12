// the text "Blue Square" on the left with an arrow pointing to a blue square on the right
<Frame rounded>
  <Group aspect={2}>
    <Text pos={[0.2, 0.5]} yrad={0.1} wrap={4} justify="center">Blue Square</Text>
    <Arrow from={[0.3, 0.5]} to={[0.6, 0.5]} />
    <Square pos={[0.75, 0.5]} yrad={0.25} rounded fill={blue} />
  </Group>
</Frame>
