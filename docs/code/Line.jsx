// draw a diagonal line in blue and a cup shaped line in red
<Group>
  <Line stroke={blue} data={[
    [0.2, 0.2],
    [0.8, 0.8],
  ]} />
  <Line stroke={red} data={[
    [0.3, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
    [0.7, 0.3],
  ]} />
</Group>
