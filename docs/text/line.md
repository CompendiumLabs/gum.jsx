# Line

*Inherits*: [Element](/docs/Element)

The `Line` element draws line segments through a series of points. It accepts a list of two or more points and connects them with straight line segments.

There are specialized variants for vertical and horizontal lines called **VLine** and **HLine**, which allow you to specify the position of the line (`loc`) and the range of the line (`lim`). See [UnitLine](/docs/UnitLine) for more details.

For smooth curves through points, use [Spline](/docs/Spline) instead.

Parameters:
- `children` — array of point coordinates (minimum of 2 required)
