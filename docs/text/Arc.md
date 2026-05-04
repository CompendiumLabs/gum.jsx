# Arc

*Inherits*: **Path** > [Element](/docs/Element)

This draws an elliptical arc that inscribes its allocated rectangle, like [Ellipse](/docs/Ellipse), but only over a selected angular interval.

Parameters:
- `start` — first angle in degrees
- `end` — second angle in degrees

Angles follow gum's usual screen-space convention: `0` points right and `90` points down. The two angles are treated as an interval; their order does not change the drawn arc.
