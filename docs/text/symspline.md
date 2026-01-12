# SymSpline

*Inherits*: [Spline](/docs/Spline) > **Path** > [Element](/docs/Element)

Flexible interface to generate smooth two-dimensional spline curves symbolically or in combination with fixed inputs. Similar to [SymLine](/docs/SymLine), but produces smooth cardinal splines instead of straight line segments.

The most common usage is to specify the range to use for x-values with `xlim` and a function to plot with `fy`. Alternatively, you can specify the transpose with `ylim`/`fx`, or even do a fully parametric curve using `tlim`/`fx`/`fy`. In any of these cases, one can either specify limits with `xlim`/`ylim`/`tlim` or specific values with `xvals`/`yvals`/`tvals`.

You'll often want to use [Plot](/docs/plot) to display these curves, as they might otherwise come out looking upside down relative to what you expect (as higher y-values mean "down" in raw SVG).

Parameters:
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
- `curve` = `1` — tension parameter that scales the tangent vectors
