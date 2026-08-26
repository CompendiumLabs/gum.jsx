# Labels

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Places a set of **Label** elements along one direction, each at its own `loc`, which is how an [Axis](/docs/Axis) lays out its tick labels. Use **HLabels** for labels spaced along the horizontal axis and **VLabels** for the vertical one. Every child must be a `Label` (or another element with an aspect and a `loc`); each is given a square box at its location, with the group's cross-direction extent on a side, so the labels are sized by the width of a `VLabels` strip or the height of an `HLabels` one. A `justify` on the group is forwarded to every label, which is how an axis right-aligns the labels beside a vertical axis.

A **Label** wraps a single string or element in a square [Anchor](/docs/Anchor) so it can be positioned by its edge. It can be spun with `spin`, and its `justify` follows the spin automatically, so a label rotated 45 degrees under a horizontal axis hangs from its right end. Use **HLabel** and **VLabel** for the two directions.

Parameters:
- `children` — the `Label` elements to place
- `direc` = `h` — the direction the labels are spaced along, `h` or `v`
- any other attributes are forwarded to each label

Label parameters:
- `children` — the label text or a single element
- `loc` — the position along the axis at which to place the label
- `direc` = `h` — the direction of the axis the label belongs to
- `spin` = `0` — the rotation of the label in degrees
- `justify` — the justification of the label within its box; defaults to a value derived from `spin` and `direc`
