# Metal Grid

This one is mostly about layering simple pieces to get a polished surface. A [Grid](/docs/Grid) of rounded rectangles creates the tiled background, and a column-wise `palette` turns that grid into a smooth cyan-to-violet gradient.

The interesting part is the overlaid spline. The code draws the same [Spline](/docs/Spline) twice, once as a wide translucent stroke and once as a thinner solid stroke, which creates the soft glowing trace. That kind of doubled stroke is a good general trick when you want a line to feel luminous without doing anything more complicated.

The nested `Frame`s matter too. They give the piece its metallic bezel and inset-screen look, so the final image reads less like a raw grid and more like a display panel.
