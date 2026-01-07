# Edge

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

## Example

Prompt: Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!". The arrowhead from "Hello" is filled in red and the arrowhead to "World!" is filled in blue.

Generated code:
```jsx
<Network node-fill={gray} edge-arrow>
  <Node id="hello" pos={[0.25, 0.25]}>Hello</Node>
  <Node id="world" pos={[0.75, 0.75]}>World!</Node>
  <Edge from="hello" to="world" from-fill={red} to-fill={blue} />
</Network>
```
