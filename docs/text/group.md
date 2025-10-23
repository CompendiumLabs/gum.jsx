# Group

*Inherits*: [Element](/docs/element)

This is the main container class that all compound elements are derived from. It accepts a list of child elements and attempts to place them according to their declared properties.

Placement positions are specified in the group's internal coordinate space, which defaults to the unit square. The child's `aspect` is an important determinant of its placement. When it has a `null` aspect, it will fit exactly in the given `rect`. However, when it does have an aspect, it needs to be adjusted in the case that the given `rect` does not have the same aspect. The `expand` and `align` specification arguments govern how this adjustment is made.

Parameters:
- `children` = `[]` — a list of child elements
- `aspect` = `null` — the aspect ratio of the group's rectangle (can pass `'auto'` to infer from the children)
- `coord` = `[0, 0, 1, 1]` — the internal coordinate space to use for child elements (can pass `'auto'` to contain children's rects)
