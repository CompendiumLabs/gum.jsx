# Fill

*Inherits*: [Shape](/docs/Shape) > **Pointstring** > [Element](/docs/Element)

Shades the area between two curves. Generates a closed polygon by running through `points1` forward and then through `points2` in reverse. Either list can be a constant, in which case `direc` controls how the constant is broadcast against the other curve. There are specialized components **VFill** and **HFill** that don't take the `direc` argument.

When both `points1` and `points2` are arrays, `direc` is ignored. When one is a constant `c`:
- `direc="h"` (default) treats `c` as a constant x-coordinate, pairing it with each y from the other curve
- `direc="v"` treats `c` as a constant y-coordinate, pairing it with each x from the other curve (useful for shading under a curve down to a horizontal baseline)

For a symbolic analogue that generates points from functions, see [SymFill](/docs/SymFill).

Parameters:
- `points1` — array of points for one boundary, or a constant
- `points2` — array of points for the other boundary, or a constant
- `direc` — broadcast direction when one boundary is a constant: `"h"` (default) or `"v"`
