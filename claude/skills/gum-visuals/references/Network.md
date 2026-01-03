# Network

*Inherits*: **Group** > **Element**

Network diagrams can be created using the **Node** and **Edge** classes. This automatically processes Node and Edge children to create a network diagram. It will also display non-network elements as they would be displayed in a **Graph**.

You can specify the internal coordinate system using the `coord` argument, which is a 4-element array specifying the position of the bottom left corner and the width and height of the coordinate system. For example, `coord: [0, 0, 1, 1]` specifies the unit square. When using `Graph`, one can also pass in `xlim`/`ylim` arguments to specify the extent of the graph.

Parameters:
- `coord` — the internal coordinate system to use, a 4-element array specifying the position of the bottom left corner and the width and height of the coordinate system

Subunits:
- `node` — arguments applied to all nodes
- `edge` — arguments applied to all edges

## Example

Prompt: A network with a node on the left saying "Hello world" and two nodes on the right, one saying "This is a test of wrapping capabilities" and the other containing a blue ellipse. There are arrows going from the left node to each of the right nodes. The nodes have gray backgrounds and rounded corners. The edges have white arrowheads.

Generated code:
```jsx
<Network aspect={1.5} node-yrad={0.15} node-rounded node-fill={gray} edge-arrow-fill={white}>
  <Node id="hello" pos={[0.25, 0.5]} wrap={3}>Hello world</Node>
  <Node id="test" pos={[0.75, 0.25]} wrap={6}>This is a test of wrapping capabilities</Node>
  <Node id="ball" pos={[0.75, 0.75]}><Ellipse aspect={1.5} fill={blue}/></Node>
  <Edge from="hello" to="test" />
  <Edge from="hello" to="ball" from-dir="s" curve={3} />
</Network>
```
