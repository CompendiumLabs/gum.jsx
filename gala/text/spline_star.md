# Spline Star

Here we have a kind of gummy star shaped thing. It is built by generating two rings of interleaved points (inner and outer) and feeding them to a closed [Spline](/docs/Spline). The figure is lightly parameterized, allowing you to change the number of points and the radius of the outer ring, in addition to the curvature of the spline.

There are two useful scripting tricks here. The first is using `map` + `polar` to convert a list of angles to Cartesian points. The second is using `zip` + `flat` to interleave the two point lists.

Note the non-standard coordinate system. By default `coord` is the unit box `[0, 0, 1, 1]`, but here we set it to `[-1, -1, 1, 1]` so we can express things in an origin-centered way.