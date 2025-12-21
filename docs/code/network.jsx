// A network with a node on the left saying "hello world" and two nodes on the right saying "hello" and "world". There are arrows going from the left node to each of the right nodes. The nodes have gray backgrounds and rounded corners.
<Network coord={[0, 0, 2, 1]} node-rad={[0.2, 0.1]} node-wrap={4} node-fill={gray} edge-arrow-size={0.07} aspect={phi}>
  <Node label="hello world" pos={[0.4, 0.5]} rad={[0.25, 0.15]}>Hello world</Node>
  <Node label="hello" pos={[1.4, 0.25]}>Hello</Node>
  <Node label="world" pos={[1.6, 0.75]}>World!</Node>
  <Edge node1="hello world" node2="hello" dir1="n" />
  <Edge node1="hello world" node2="world" dir1="s" />
</Network>
