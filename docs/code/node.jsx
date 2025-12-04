// Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!".
<Network node-rad={[0.2, 0.1]} node-fill={gray}>
  <Node label="hello" pos={[0.2, 0.2]}>Hello</Node>
  <Node label="world" pos={[0.8, 0.8]}>World!</Node>
  <Edge node1="hello" node2="world" />
</Network>
