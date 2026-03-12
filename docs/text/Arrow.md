# Arrow

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Draws an arrowhead, optionally with a tail line extending behind it. The arrow is centered on its local origin and points in the direction specified by `direc` in degrees.

The head and tail can be styled separately using prefixed parameters. The head is built from **ArrowHead**-style geometry, while the tail is a simple [Line](/docs/Line).

For curved paths between different points, see the more user-friendly [ArrowPath](/docs/ArrowPath), which is used for **Network** diagrams.

Parameters:
- `direc` = `0` — the arrow direction in degrees
- `head` = `0.25` — size of the arrowhead
- `tail` = `1` — length of the tail segment behind the head

Subunit names:
- `head` — forwarded to the arrowhead
- `tail` — forwarded to the tail line
