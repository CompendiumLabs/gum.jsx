# Spline

*Inherits*: **Path** > [Element](/docs/Element)

This creates a smooth cardinal spline curve through a series of points. The tangent at each interior point is computed as the central difference between its neighbors, while endpoints use forward/backward differences. This produces a smooth, natural-looking curve that passes through all specified points.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)
- `curve` = `1` — tension parameter that scales the tangent vectors. Lower values (e.g., 0.5) create tighter curves with less overshoot, while higher values (e.g., 1.5) create looser, more flowing curves. A value of 0.5 produces a Catmull-Rom spline.
