# Edge

*Inherits*: [Arrow](/docs/Arrow) > [Group](/docs/Group) > [Element](/docs/Element)

This creates a cubic spline path from one point to another with optional arrowheads at either or both ends. It is named **Edge** because of its usage in network diagrams with [Network](/docs/Network). The emanation directions are automatically inferred from the relative point positions but can be overriden as well. See [Arrow](/docs/Arrow) for more details on the paths and arrowheads.

Parameters:
- `start`/`end` — the beginning and ending [Node](/docs/Node) for the path and where the optional arrowheads are placed, or a `[node, direc]` pair where `direc` specifies the emanation direction
- `start_dir`/`end_dir` — the emanation directions of the arrowheads (cardinal strings or direction vectors)
- `points` — the intermediate points to draw the spline between
- `arrow` / `arrow_start` / `arrow_end` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow_end` and `false` for `arrow_start`, meaning a directed graph edge
- `arrow_size` = `0.04` — the arrowhead size to use for both arrows
- `curve` = `2` — curvature factor forwarded to the spline
