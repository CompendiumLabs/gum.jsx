# Transformer

This is a block diagram of a decoder-only transformer, drawn as a single vertical column from input tokens up to output probabilities. It is a good illustration of building a diagram out of small local components rather than placing things by hand.

Three helpers do almost all of the work. `Block` is a rounded [Frame](/docs/Frame) with a fixed `aspect` and a centered [Text](/docs/Text) label, `Flow` is a one-segment [Arrow](/docs/Arrow) pointing upward, and `tint` lightens each palette color with `interp` so the fills stay pastel. Because every piece declares its own aspect ratio, the enclosing [VStack](/docs/VStack) can work out all of the heights itself, and the arrows automatically line up with the blocks they connect.

The repeated layer is just a nested **Frame** wrapped around its own **VStack**, which gives the inner group its border and padding for free. The `Loop` arrow beside it is the one place that steps outside the unit box: its points run from `-yside` to `1 + yside`, so the dashed path leaves the layer frame, arcs around the right side, and rejoins below it. Corners are softened with `rounded` rather than drawn as separate segments, and the `× N` label is a [TextBox](/docs/TextBox) with a white fill that sits on top of the path to knock a gap in it.

The `arrow-size` and `arrow-curve` props are also worth noting. These are prefixed attributes that **Arrow** forwards to its [ArrowHead](/docs/ArrowHead), which is how the flow arrows and the much longer loop arrow end up with heads of visibly different sizes without defining two separate components.
