// A network with a node on the left saying "hello world" and two nodes on the right saying "hello" and "world". There are arrows going from the left node to each of the right nodes. The nodes have gray backgrounds and rounded corners.
<Network node-fill={gray} edge-arrow-size={0.04} aspect={1.5}>
  <TextNode label="hello" pos={[0.2, 0.5]} wrap={3}>Hello world!</TextNode>
  <TextNode label="basic" pos={[0.7, 0.2]} rad={0.1}>Basic</TextNode>
  <Node label="blue" pos={[0.8, 0.75]}>
    <Ellipse fill={blue}/>
  </Node>
  <Edge node1="hello" node2="basic" dir1="n" curve={3} />
  <Edge node1="hello" node2="blue" />
</Network>
