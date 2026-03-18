# Flux Capacitance

This is a simple example of a multi-element [Plot](/docs/Plot). The figure combines a shaded [SymFill](/docs/SymFill) region with two overlaid [SymLine](/docs/SymLine) curves, then lets **Plot** handle the axes, grid, labels, and title. It is a nice pattern when you want several related elements to share the same plotting frame.

One useful detail is that `xlim` and `ylim` are flexible. If you put them on the outer **Plot**, they get pushed down to the children automatically. But you can also put limits on the individual children, which is handy when different plotted elements want different domains.