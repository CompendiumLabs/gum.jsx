# ArrowSpline

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Draws a curved path between two points with optional arrowheads at either or both ends. This is the low-level path primitive used by [Edge](/docs/Edge) inside [Network](/docs/Network), but it can also be used on its own when you already know the endpoint coordinates.

The spline direction is controlled by `from-dir` and `to-dir`. If those are omitted, they default to the direction from `from` to `to`.

Parameters:
- `from` / `to` — the starting and ending points of the edge path
- `from-dir` / `to-dir` — tangent directions at the start and end, either cardinal strings or direction vectors
- `arrow` / `from-arrow` / `to-arrow` — toggles whether arrowheads are included. `arrow` applies to both ends.
- `arrow-size` = `0.03` — arrowhead size
- `curve` = `2` — curvature factor forwarded to the spline

Subunit names:
- `spline` — forwarded to the spline shaft, for example `spline_stroke`
- `arrow` — forwarded to both arrowheads
- `from` / `to` — forwarded to the start and end arrowheads respectively
