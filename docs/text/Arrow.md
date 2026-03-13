# Arrow

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Draws a straight arrow between two points. This is the straight-line counterpart to [ArrowSpline](/docs/ArrowSpline): it uses `from` and `to` endpoints, but renders a simple [Line](/docs/Line) shaft instead of a curved spline.

The line and arrowhead can be styled separately using prefixed parameters. The head is built from **ArrowHead**-style geometry, while the shaft is a simple [Line](/docs/Line).

The arrow direction is inferred automatically from `from` to `to`.

Parameters:
- `points` — the points to draw the arrow between (can include intermediate points)
- `start_dir` / `end_dir` — the direction of the arrowheads at the start and end
- `arrow` / `arrow_start` / `arrow_end` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow_end` and `false` for `arrow_start`, meaning a directed graph edge
- `arrow_size` = `0.04` — size of the arrowhead
- `curve` = `null` — curvature factor forwarded to the spline (`null` or zero means straight line)

Subunit names:
- `line` — forwarded to the shaft line
- `arrow` — forwarded to the arrowhead
- `start` / `end` — forwarded to the start and end arrowheads respectively
