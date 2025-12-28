// A curved line going from the upper left to the lower right. The left side of the line has a red arrow facing left and the right side has a blue arrow facing right. Both arrows are triangular with black borders.
<Network node-fill={gray} edge-arrow>
  <TextNode label="hello" pos={[0.25, 0.25]}>Hello</TextNode>
  <TextNode label="world" pos={[0.75, 0.75]}>World!</TextNode>
  <Edge node1="hello" node2="world" arrow1-fill={red} arrow2-fill={blue} />
</Network>
