// Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!". There is a city-block path connecting the two boxes. The arrowhead from "Hello" is filled in red and the arrowhead to "World!" is filled in blue.
<Network aspect node-fill={gray} edge-arrow edge-rounded={0.025}>
  <Node id="hello" pos={[0.3, 0.25]}>Hello</Node>
  <Node id="world" pos={[0.7, 0.75]}>World!</Node>
  <Edge start="hello" end="world" points={[[0.3, 0.5], [0.7, 0.5]]}/>
</Network>
