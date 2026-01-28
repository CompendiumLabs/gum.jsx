# Networks Elements

## Node

*Inherits*: **Frame** > **Element**

This encloses an element in a **Frame** at a particular position. If the `children` argument is a string, it will be automatically wrapped in a **Text** element. The primary usage of this is in the creation of networks using the **Network** component. You must provide an `id` argument to reference the node in an **Edge** element.

Parameters:
- `id` — a string to be used as the node identifier
- `children` — the element or text to be enclosed in the node box
- `yrad` = `0.1` — the radius of the node box (will adjust to aspect)
- `padding` = `0.1` — the padding of the node box
- `border` = `1` — the border width of the node box
- `rounded` = `0.05` — the radius of the corners of the node box
- `wrap` = `null` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)
- `justify` = `'center'` — the horizontal justification of the text

**Example**

Prompt: Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!".

Generated code:
```jsx
<Network aspect node-fill={gray}>
  <Node id="hello" pos={[0.25, 0.25]}>Hello</Node>
  <Node id="world" pos={[0.75, 0.75]}>World!</Node>
  <Edge from="hello" to="world" />
</Network>
```

## Edge

*Inherits*: **Group** > **Element**

This creates a cubic spline path from one point to another with optional arrowheads at either or both ends. It is named **Edge** because of its usage in network diagrams with **Network**. The emanation directions are automatically inferred from the relative point positions but can be overriden as well.

Parameters:
- `from`/`to` — the beginning and ending **Node** for the path and where the optional arrowheads are placed, or a `[node, direc]` pair where `direc` specifies the emanation direction
- `from-dir`/`to-dir` — the emanation directions of the arrowheads, either `'n'`/`'s'`/`'e'`/`'w'` or a `[dx, dy]` pair
- `arrow`/`from-arrow`/`to-arrow` — toggles whether the respective arrowheads are included. Defaults to `true` for `to-arrow` and `false` for `from-arrow`, meaning a directed graph edge
- `arrow-size` = `0.03` — the arrowhead size to use for both arrows
- `arrow-base` = `false` — toggles whether the arrowhead base is included

Subunits:
- `arrow`/`from`/`to` — the respective arrowheads, with `arrow` being applied to both
- `spline` — the cubic spline path element

**Example**

Prompt: Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!". The arrowhead from "Hello" is filled in red and the arrowhead to "World!" is filled in blue.

Generated code:
```jsx
<Network aspect node-fill={gray} edge-arrow>
  <Node id="hello" pos={[0.25, 0.25]}>Hello</Node>
  <Node id="world" pos={[0.75, 0.75]}>World!</Node>
  <Edge from="hello" to="world" from-fill={red} to-fill={blue} />
</Network>
```

## Network

*Inherits*: **Group** > **Element**

Network diagrams can be created using the **Node** and **Edge** classes. This automatically processes Node and Edge children to create a network diagram. It will also display non-network elements as they would be displayed in a **Graph**.

You can specify the internal coordinate system using the `coord` argument, which is a 4-element array specifying the position of the bottom left corner and the width and height of the coordinate system. For example, `coord: [0, 0, 1, 1]` specifies the unit square. When using `Graph`, one can also pass in `xlim`/`ylim` arguments to specify the extent of the graph.

Parameters:
- `coord` — the internal coordinate system to use, a 4-element array specifying the position of the bottom left corner and the width and height of the coordinate system

Subunits:
- `node` — arguments applied to all nodes
- `edge` — arguments applied to all edges

**Example**

Prompt: A network with a node on the left saying "Hello world" and two nodes on the right, one saying "This is a test of wrapping capabilities" and the other containing a blue ellipse. There are arrows going from the left node to each of the right nodes. The nodes have gray backgrounds and rounded corners. The edges have white arrowheads.

Generated code:
```jsx
<Network aspect={1.5} node-yrad={0.15} node-rounded node-fill={gray} edge-fill={white}>
  <Node id="hello" pos={[0.25, 0.5]} wrap={3}>Hello world</Node>
  <Node id="test" pos={[0.75, 0.25]} wrap={6}>This is a test of wrapping capabilities</Node>
  <Node id="ball" pos={[0.75, 0.75]}><Ellipse aspect={1.5} fill={blue}/></Node>
  <Edge from="hello" to="test" />
  <Edge from="hello" to="ball" from-dir="s" curve={3} />
</Network>
```
