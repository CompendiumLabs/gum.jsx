# Stack

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Stack one or more **Element** either vertically or horizontally. There are specialized components **VStack** and **HStack** that don't take the `direc` argument. Expects a `stack-size` parameter for each child.

Children with `null` size will be given remaining space. This behavior depends on the `expand` flag. If `expand` is `false`, the remaining space is split evenly. If `expand` is `true`, then space is distributed in inverse proportion to the child's aspect ratio, so that all elements will reach full width (in the **VStack** case) or full height (in the **HStack** case).

Child parameters:
- `stack-size` = `null` — the size of the child element
- `stack-expand` = `true` — whether to expand the child to fill the remaining space

Parameters:
- `direc` — the direction of stacking: `v` or `h`
- `spacing` = `0` — total amount of space to add between child elements
