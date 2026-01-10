# Spline

*Inherits*: **Path** > [Element](/docs/Element)

This creates a smooth cardinal spline curve through a series of points. The tangent at each interior point is computed as the central difference between its neighbors, while endpoints use forward/backward differences. This produces a smooth, natural-looking curve that passes through all specified points.

The `curve` parameter controls the tension of the spline. Lower values (e.g., 0.5) create tighter curves with less overshoot, while higher values (e.g., 1.5) create looser, more flowing curves. A value of 0.5 produces a Catmull-Rom spline.

Parameters:
- `children` — array of point coordinates (minimum of 2 required)
- `curve` = `1` — tension parameter that scales the tangent vectors
- `closed` = `false` — toggles whether to make it a closed loop
- `tan1`/`tan2` — the tangent vectors at the first and last points
