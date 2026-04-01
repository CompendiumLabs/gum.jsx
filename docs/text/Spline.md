# Spline

*Inherits*: **Path** > [Element](/docs/Element)

This creates a smooth cardinal spline curve through a series of points. The tangent at each interior point is computed as the central difference between its neighbors, while endpoints use forward/backward differences. This produces a smooth, natural-looking curve that passes through all specified points.

The `curve` parameter controls the tension of the spline. Lower values (e.g., 0.5) create tighter curves with less overshoot, while higher values (e.g., 1.5) create looser, more flowing curves. The default value of 0.5 produces the canonical *Catmull-Rom* spline.

In some cases, you may want to construct spline data explicitly (say to place points or labels along a spline). In this cases, there is a `spline2d` function that accepts the same arguments as this component but returns a t -> (x,y) spline function over `[0, 1]`. There is also a `spline1d` function that returns an x -> y spline function.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)
- `curve` = `0.5` — tension parameter that scales the tangent vectors
- `closed` = `false` — toggles whether to make it a closed loop
- `start-dir`/`end-dir` — the direction vectors at the first and last points (defaults to start and end points direction)
