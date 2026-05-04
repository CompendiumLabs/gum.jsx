# Edge

*Inherits*: [Arrow](/docs/Arrow) > [Group](/docs/Group) > [Element](/docs/Element)

This creates a cubic spline path from one element (typically a [Node](/docs/Node)) to another with optional arrowheads at either or both ends. It is named **Edge** because of its usage in network diagrams with [Network](/docs/Network). The emanation directions are automatically inferred from the relative node positions but can be overriden as well.

Use [Arrow](/docs/Arrow) for creating edges between arbitrary points and for details on options for the path and arrowheads.

Parameters:
- `start`/`end` — the beginning and ending element for the path
- `start-side`/`end-side` — the attachment side of the arrowheads (cardinal strings)
- `start-loc`/`end-loc` — the attachment location of the arrowheads (a number between 0 and 1)
- `points` — the intermediate points to draw the spline between
- `arrow` / `arrow-start` / `arrow-end` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow-end` and `false` for `arrow-start`, meaning a directed graph edge
- `arrow-size` = `0.04` — the arrowhead size to use for both arrows
- `curve` = `2` — curvature factor forwarded to the [Spline](/docs/Spline)
- `rounded` = `null` — corner radius for a city-block path using [RoundedLine](/docs/RoundedLine)
