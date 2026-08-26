# Mesh

*Inherits*: [Scale](/docs/Scale) > [Group](/docs/Group) > [Element](/docs/Element)

Draws a set of parallel grid lines over its whole box: a [Scale](/docs/Scale) whose ticks span the full cross direction. **HMesh** places vertical lines at positions along the horizontal axis and **VMesh** places horizontal lines at positions along the vertical axis, which is what [Plot](/docs/Plot) draws for `xgrid` and `ygrid`. **Mesh2D** combines the two into a full grid.

The locations are in the element's coordinate space, given by `xlim`/`ylim` or `coord`, so a mesh inside a [Graph](/docs/Graph) lines up with data coordinates; when `locs` is a count, the lines are spread evenly over that range.

Parameters:
- `locs` = `10` — either an integer for evenly spaced lines, or a list of line locations
- `direc` = `h` — the axis the lines are spaced along, `h` or `v`; the lines run the other way
- `xlim`/`ylim`/`coord` — the coordinate range, used to spread a count of `locs` and to place a list of them
- any other attributes are forwarded to the lines

Mesh2D parameters:
- `locs` = `10` — the line count or locations used for both directions
- `xlocs`/`ylocs` — the counts or locations for each direction, overriding `locs`
- `xlim`/`ylim`/`coord` — the coordinate range, as above
