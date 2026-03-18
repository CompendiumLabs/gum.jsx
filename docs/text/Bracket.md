# Bracket

*Inherits*: [HStack](/docs/HStack) > [Group](/docs/Group) > [Element](/docs/Element)

Wraps a single child in a matched pair of delimiters. The delimiter can be chosen from a preset name or given as a pair to mix left and right shapes.

Parameters:
- `children` — a single element to enclose
- `delim` = `'round'` — one of `'round'`, `'square'`, `'curly'`, `'angle'`, or a `[left, right]` pair of those values

Subunit names:
- `delim` — forwarded to the generated delimiter symbols, for example `delim-size`
