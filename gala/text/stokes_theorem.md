# Stokes' Theorem

This one mixes a mathematical diagram with a short explanatory panel. The layout is straightforward, just an `HStack` with a surface picture on one side and a formula-and-text block on the other, but the surface drawing itself is doing some real work.

The key idea is that the surface is parameterized in `(u, v)` coordinates and then projected into the plane by hand. Once that machinery is in place, the boundary curve, mesh lines, tangent arrows, and normal arrows can all be generated from the same underlying surface data. That is a nice pattern for geometric figures: define the math once, then derive multiple visual layers from it.

There is also a bit of vector calculus baked in here. The normal arrows come from a cross product of the surface derivatives, so the picture is not just decorative; it is tied to the geometry behind the theorem.
