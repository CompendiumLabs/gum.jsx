// Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!".
<Network node-fill={gray}>
  <TextNode label="hello" pos={[0.25, 0.25]}>Hello</TextNode>
  <TextNode label="world" pos={[0.75, 0.75]}>World!</TextNode>
  <Edge node1="hello" node2="world" />
</Network>
