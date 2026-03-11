# Shape

*Inherits*: **Pointstring** > [Element](/docs/Element)

The `Shape` element draws a closed polygon through a series of points. It accepts a list of two or more points and connects them with straight line segments, automatically closing the shape by connecting the last point back to the first.

For open multiple-segment paths, use [Line](/docs/Line) instead.

Parameters:
- `children` — array of point coordinates (minimum of 2 required)
