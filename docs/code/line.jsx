// draw a diagonal line in blue and a cup shaped line in red
<Group>
  <Line stroke={blue}>{[
    [0.2, 0.2],
    [0.8, 0.8],
  ]}</Line>
  <Line stroke={red}>{[
    [0.3, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
    [0.7, 0.3],
  ]}</Line>
</Group>
