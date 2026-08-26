# Legend

*Inherits*: [Frame](/docs/Frame) > [Group](/docs/Group) > [Element](/docs/Element)

A boxed legend: a column of badges, each beside its label, in a rounded [Frame](/docs/Frame) with a solid background so it can sit over the contents of a [Graph](/docs/Graph) or [Plot](/docs/Plot). Each child is a badge specification carrying a `label`. A badge is either an element (a [Dot](/docs/Points), a dashed [Line](/docs/Line), a coloured [Rect](/docs/Rect), …), which is used as is with its own aspect, or an object of attributes such as `{ stroke: blue, label: 'series' }`, which becomes a short line in that style. Labels are strings, set as text, or elements.

The legend gets an aspect from its rows, so place it in a graph with `pos` and `ysize` (or `rad`) in the graph's coordinates.

Parameters:
- `children` — the badge specifications, each with a `label`
- `vspacing` = `0.1` — the vertical spacing between rows
- `hspacing` = `0.25` — the gap between a badge and its label, relative to the badge
- `padding` = `0.05` — the padding inside the frame
- `rounded` = `0.025` — the corner radius of the frame
- `fill` = `white` — the background colour of the frame
- `justify` = `left` — the horizontal justification of the rows

Subunit names:
- `badge` — forwarded to the badges built from attribute objects
- `text` — forwarded to the labels built from strings
