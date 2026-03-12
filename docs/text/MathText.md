# MathText

*Inherits*: [HStack](/docs/HStack) > [Group](/docs/Group) > [Element](/docs/Element)

Arranges math items in a horizontal row with automatic inter-atom spacing. Strings, numbers, and booleans are automatically converted to math symbols, nested **MathText** is flattened, and ordinary gum [Element](/docs/Element) values can be mixed inline as well.

For math-to-math neighbors, spacing is derived from atom classes like `mord`, `mbin`, and `mrel`. For mixed or non-math neighbors, the fallback `spacing` value is used.

Parameters:
- `children` — math items, nested arrays of math items, or ordinary `Element`s
- `spacing` = `0.25` — default spacing used between non-math neighbors and mixed math/non-math neighbors
- `vshift` = `0.1` — vertical shift applied to the rendered row
- all usual stack layout parameters are also accepted
