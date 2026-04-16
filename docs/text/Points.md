# Points

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Place copies of a common shape at various points. Marker size is controlled with `point-size`, while the **Points** element itself can still be laid out with the normal `size`/`xsize`/`ysize` element parameters. The default shape is a black dot.

When used inside [Graph](/docs/Graph) or [Plot](/docs/Plot), the point coordinates are also reported for automatic limit detection. This means point clouds can now expand plot limits without requiring `coord="auto"` on the **Points** element itself.

Keyword arguments:
- `points` — a list of points, where each point is either an `[x, y]` pair
- `point-shape` = `Dot` — the default shape to use for children
- `point-size` = `0.05` — the default size to use for children
- `...` = `{}` — additional attributes are passed to the default shape (like `stroke` or `fill`)
