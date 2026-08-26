# Scale

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Draws a row of tick marks: short lines perpendicular to the scale's direction, placed at `locs` along it. It is the building block for the ticks of an [Axis](/docs/Axis) and the lines of a [Mesh](/docs/Mesh). Use **HScale** for ticks spaced along the horizontal axis (which are vertical lines) and **VScale** for ticks spaced along the vertical axis (horizontal lines).

Each tick spans the cross direction over `span`, so a scale that fills its box with `span = [0, 1]` draws full-height ticks, and a `span` of `[0.4, 0.6]` draws short ones through the middle. Tick locations are in the element's coordinate space, so a scale inside a [Graph](/docs/Graph) can be given data coordinates directly.

Parameters:
- `locs` = `0` — either an integer for evenly spaced ticks over `span`, or a list of tick locations along the scale's direction
- `direc` = `h` — the direction the ticks are spaced along, `h` or `v`; the ticks themselves run the other way
- `span` = `[0, 1]` — the extent of each tick across the scale's direction
- `children` — a list of elements to use as the ticks instead of the generated lines. Each must carry a `tick-loc` and may carry a `tick-span`, and is stretched to that rect
- any other attributes are forwarded to the tick lines
