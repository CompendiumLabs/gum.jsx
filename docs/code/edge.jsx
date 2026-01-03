// Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!". The arrowhead from "Hello" is filled in red and the arrowhead to "World!" is filled in blue.
<Network node-fill={gray} edge-arrow>
  <Node id="hello" pos={[0.25, 0.25]}>Hello</Node>
  <Node id="world" pos={[0.75, 0.75]}>World!</Node>
  <Edge from="hello" to="world" from-fill={red} to-fill={blue} />
</Network>
