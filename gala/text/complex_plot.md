# Complex Plot

This is another nice example of a multi-element [Plot](/docs/Plot), but here the elements are doing more explanatory work. The grid, axes, implicit-looking curves, marked points, and text labels all live in the same plotting frame, so the result reads more like a mathematical diagram than a plain chart.

The small `Curve` helper is doing useful cleanup. It wraps [SymLine](/docs/SymLine) with shared styling and a fixed `ylim`, then the actual branches are defined just by their formulas. Notice that these are written as `x = f(y)` rather than the more usual `y = f(x)`, which is a good reminder that the symbolic plot elements can work either way.

One small trick worth noting is the use of `maximum(0, ...)` inside the square roots. That clips away the invalid region and avoids taking square roots of negative values, which keeps the plotted branches well behaved at their endpoints.
