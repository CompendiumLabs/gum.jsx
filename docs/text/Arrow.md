# Arrow

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Draws a straight arrow between two points. This is the straight-line counterpart to [ArrowSpline](/docs/ArrowSpline): it uses `from` and `to` endpoints, but renders a simple [Line](/docs/Line) shaft instead of a curved spline.

The line and arrowhead can be styled separately using prefixed parameters. The head is built from **ArrowHead**-style geometry, while the shaft is a simple [Line](/docs/Line).

The arrow direction is inferred automatically from `from` to `to`.

Parameters:
- `points` — the points to draw the arrow between (can include intermediate points)
- `start-dir` / `end-dir` — the direction of the arrowheads at the start and end
- `arrow` / `arrow-start` / `arrow-end` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow-end` and `false` for `arrow-start`, meaning a directed graph edge
- `arrow-size` = `0.04` — size of the arrowhead
- `curve` = `null` — curvature factor forwarded to the [Spline](/docs/Spline) (`null` or zero means straight line)
- `rounded` = `null` — corner radius for a city-block path through `points`. When set, the shaft is a [RoundedLine](/docs/RoundedLine) (takes precedence over `curve`)

Subunit names:
- `line` — forwarded to the shaft line
- `arrow` — forwarded to the arrowhead
- `start` / `end` — forwarded to the start and end arrowheads respectively
