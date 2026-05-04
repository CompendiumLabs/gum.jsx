# RoundedLine

*Inherits*: **Path** > [Element](/docs/Element)

The `RoundedLine` element draws a polyline through a series of points with rounded corners at each interior vertex. It is most useful for *city-block* (right-angle) routes — for instance, edges in a network diagram that you want to bend cleanly around obstacles rather than curving with [Spline](/docs/Spline). Spline curvature along an otherwise-straight `points` route produces undulating bumps; `RoundedLine` keeps the straight segments straight and only rounds the turns.

Each interior vertex is replaced by a circular arc whose radius is derived from `radius` in coord space. When the coordinate system is not square, `RoundedLine` uses the smaller mapped axis so corners stay circular in pixel space instead of stretching into ellipses. If a segment is too short for the requested radius, the corner is automatically clamped so adjacent corners can never overlap.

For straight-line polylines (no corner rounding) use [Line](/docs/Line). For smooth curves through points use [Spline](/docs/Spline).

Parameters:
- `points` — array of point coordinates (minimum of 2 required)
- `radius` = `0.05` — corner back-off distance in coord space, applied at each interior vertex
