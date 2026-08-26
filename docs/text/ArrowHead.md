# ArrowHead

*Inherits*: **Path** > [Element](/docs/Element)

Draws a single arrowhead: two barbs meeting at a tip. It is the head used by [Arrow](/docs/Arrow), [Edge](/docs/Edge), and the [Axis](/docs/Axis) arrows, and can be placed on its own with `pos` and `size` like any other element. The head is drawn in its own unit box pointing right, with the tip at the box's right edge, and then rotated to `angle`; the barbs each span half the box, so `size` sets the barb length.

By default the head is an open stroke, just the two barbs. Giving it a `fill` closes it into a filled triangle by joining the barb ends with a base line (`base` controls this directly). The barbs can be bowed toward the shaft with `curve` to get the flared look of a typeset arrow, and a harpoon keeps only one of them with `barb`.

Parameters:
- `angle` = `0` — the direction the tip points in degrees, with `0` pointing right and positive angles following positive y
- `arc` = `75` — the spread between the two barbs in degrees
- `curve` = `0` — how much the barbs bow toward the shaft: `0` gives straight barbs, `1` leaves the tip tangent to the shaft (Computer Modern's arrows are about `0.7`)
- `barb` = `both` — which barbs to draw, relative to the direction of travel: `both`, `left`, or `right` (one barb makes a harpoon)
- `base` — whether to close the head with a line across the barb ends; defaults to `true` when `fill` is given and `false` otherwise
- `exact` = `true` — pull the tip back by half the stroke width so the stroked outline ends exactly at `pos`
- `stroke-linecap` = `round` / `stroke-linejoin` = `round` — line caps and joins
