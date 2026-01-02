# Edge

*Inherits*: **Group** > **Element**

This creates a cubic spline path from one point to another with optional arrowheads at either or both ends. It is named **Edge** because of its usage in network diagrams with **Network**. The emanation directions are automatically inferred from the relative point positions but can be overriden as well.

Parameters:
- `node1`/`node2` — the beginning and ending **Node** for the path and where the optional arrowheads are placed, or a `[node, direc]` pair where `direc` specifies the emanation direction
- `dir1`/`dir2` — the emanation directions of the arrowheads, either `'n'`/`'s'`/`'e'`/`'w'` or a `[dx, dy]` pair
- `arrow`/`arrow1`/`arrow2` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow2` and `false` for `arrow1`, meaning a directed graph edge
- `arrow-size` = `0.03` — the arrowhead size to use for both arrows
- `arrow-base` = `false` — toggles whether the arrowhead base is included

Subunits:
- `arrow`/`arrow1`/`arrow2` — the respective arrowheads, with `arrow` being applied to both
- `path` — the connecting line element

## Example

Prompt: A curved line going from the upper left to the lower right. The left side of the line has a red arrow facing left and the right side has a blue arrow facing right. Both arrows are triangular with black borders.

Generated code:
```jsx
<Network node-fill={gray} edge-arrow>
  <TextNode label="hello" pos={[0.25, 0.25]}>Hello</TextNode>
  <TextNode label="world" pos={[0.75, 0.75]}>World!</TextNode>
  <Edge node1="hello" node2="world" arrow1-fill={red} arrow2-fill={blue} />
</Network>
```
