# Unit Distance

This example turns an algebraic point set into a unit-distance graph. The points are generated as integer linear combinations of the complex basis `1`, `i`, `\zeta_3`, and `i\zeta_3`, where `\zeta_3 = e^{2\pi i/3}`. After mapping those combinations into the complex plane, the figure draws every edge whose coefficient difference has complex norm one.

The important part is that unit distances are detected before the coordinates become pixels. The `isUnitDelta` helper checks an exact quadratic condition on the coefficient vector, which avoids fragile floating-point distance comparisons between plotted points. A `Map` from coefficient keys to nodes then makes it cheap to look up whether the other endpoint of each unit step is present in the finite sample.

The rendering is also intentionally batched. [Points](/docs/Points) handles the point cloud, while `Segments` draws the unit edges as a single SVG path instead of creating a separate [Line](/docs/Line) element for every edge. That keeps the example responsive even though the graph has many repeated local hexagonal patterns.
