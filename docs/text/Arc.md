# Arc

*Inherits*: **Path** > [Element](/docs/Element)

This draws an elliptical arc that inscribes its allocated rectangle, like [Ellipse](/docs/Ellipse), but only over a selected angular interval.

Parameters:
- `start` — first angle in degrees
- `end` — second angle in degrees

Angles follow the current coordinate system: `0` points right and positive angles follow positive y. In the default screen coordinate system, `90` points down; inside a default [Graph](/docs/Graph), where y is flipped upward, `90` points up. The two angles are treated as an interval; their order does not change the drawn arc.
