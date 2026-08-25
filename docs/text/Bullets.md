# Bullets

*Inherits*: [VStack](/docs/Stack) > [Group](/docs/Group) > [Element](/docs/Element)

A bulleted list. Each child becomes an item: strings and [Text](/docs/Text) elements are wrapped to the list width minus the indent, with a marker placed in the indent level with the first line. Other elements (say a [Latex](/docs/Latex) equation) are placed as-is with a marker beside them. A nested `Bullets` child becomes a sub-list, indented without a marker of its own.

All widths are in em, so text in a `Bullets` comes out the same size as a `Text` with the same `wrap`. This makes it fit naturally inside a [Slide](/docs/Slide), which sets `wrap` on all of its children.

Parameters:
- `children` — the list items: strings, `Text` elements, other elements, or nested `Bullets`
- `wrap` = `25` — the total width of the list in ems
- `marker` = `'•'` — the marker string or element placed beside each item
- `indent` = `1.5` — the width of the marker column in ems
- `gap` = `0.5` — the vertical space between items in ems
- `spacing` — the total stack spacing fraction; overrides `gap` when given
- `justify` = `'left'` — the horizontal justification of item text
- `font-family`/`font-weight`/`font-style` — font settings for the item text
- `text-*` — additional arguments forwarded to each item's `Text`
