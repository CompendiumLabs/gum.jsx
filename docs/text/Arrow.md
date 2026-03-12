# Arrow

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Draws a straight arrow between two points. This is the straight-line counterpart to [ArrowSpline](/docs/ArrowSpline): it uses `from` and `to` endpoints, but renders a simple [Line](/docs/Line) shaft instead of a curved spline.

The line and arrowhead can be styled separately using prefixed parameters. The head is built from **ArrowHead**-style geometry, while the shaft is a simple [Line](/docs/Line).

The arrow direction is inferred automatically from `from` to `to`.

Parameters:
- `from` / `to` — the start and end points of the arrow shaft
- `arrow_size` = `0.5` — size of the arrowhead

Subunit names:
- `line` — forwarded to the shaft line
- `arrow` — forwarded to the arrowhead
