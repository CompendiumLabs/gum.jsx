# Polygon Slide

This one is built in a nicely modular way. The key move is the local `RegularPolygon` component, which wraps [SymShape](/docs/SymShape) and hides the circle parameterization with `fx={cos}`, `fy={sin}`, and `tvals`. Once that helper exists, the slide can generate six examples by simply mapping over `[n, name]` pairs.

The overall composition is handled with layout elements rather than manual positioning. A [Slide](/docs/Slide) provides the title text, and a [Grid](/docs/Grid) lays out the six cards in two rows. Each card is just a `Frame` plus a `VStack`, which keeps the polygon and its label in a consistent proportion. Notice how we set `stack-size` on the text so it doesn't get too tall.

The color handling is also worth noting. `palette(blue, purple, [3, 8])` turns the side count into a smooth color ramp, so the sequence reads as a progression rather than a collection of unrelated fills. There is also a small `spin` adjustment in `RegularPolygon`, which helps each shape sit in a more natural upright orientation.
