# Points

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Place copies of a common shape at various points. The radius can be specified by the `size` keyword and overridden for particular children. The default shape is a black dot.

Keyword arguments:
- `children` — a list of points, where each point is either an `[x,y]` pair
- `shape` = `Dot` — the default shape to use for children
- `size` = `0.025` — the default radius to use for children
- `...` = `{}` — additional attributes are passed to the default shape (like `stroke` or `fill`)
