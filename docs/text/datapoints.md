# DataPoints

*Inherits*: [Group](/docs/group) > [Element](/docs/element)

Flexible interface to generate sets of points symbolically or in combination with fixed inputs. The most common usage is to specify the range for x-values with `xlim` and a function to plot with `fy`. But you can specify the transpose with `ylim`/`fx`, or do a fully parametric path using `tlim`/`fx`/`fy`.

You can also specify the radius of the points functionally with `size` and the shape with `children`. Both of these functions take `(x, y, t, i)` values as inputs and return the desired value for each point.

Parameters:
- `children` = `Dot` — a shape or function mapping from `(x, y, t, i)` values to a shape
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `size` = `0.025` — a size or a function mapping from `(x, y, t, i)` values to a size
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits
