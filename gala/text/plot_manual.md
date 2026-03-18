# Plot Manual

This is basically the manual version of [Plot](/docs/Plot). Instead of using the wrapper, it builds the graph from a `Group` with an explicit coordinate system, then adds the mesh, axes, and curve one piece at a time.

That makes it a useful example if you want to understand what **Plot** is abstracting away. You get direct control over where the axes sit and how big they are, which is why the code computes the small `ratio` factor before placing the vertical axis. Once you are doing this kind of thing often, though, it is usually easier to go back to **Plot**.