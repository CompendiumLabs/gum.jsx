# SupSub

*Inherits*: [HStack](/docs/HStack) > [Group](/docs/Group) > [Element](/docs/Element)

Places a superscript and subscript stack to the right of a base expression. The base comes from `children`, and `sup` / `sub` can be either elements or scalar values, which are automatically wrapped as math symbols.

Parameters:
- `children` — a single base element
- `sup` / `sub` — the superscript and subscript content
- `hspacing` = `0.025` — horizontal gap between the base and the script stack
- `vspacing` = `-0.025` — spacing between the superscript and subscript rows
- `vshift` = `0.025` — vertical offset applied to the script stack
