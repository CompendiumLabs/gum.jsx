// draw a blue triangle with a semi-transparent green square overlaid on top
<Group>
  <Shape fill={blue} stroke={none} points={[
    [0.5, 0.2],
    [0.8, 0.8],
    [0.2, 0.8]
  ]} />
  <Shape fill={green} stroke={none} opacity={0.5} points={[
    [0.3, 0.3],
    [0.7, 0.3],
    [0.7, 0.7],
    [0.3, 0.7]
  ]} />
</Group>
