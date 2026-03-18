# Atomic Orbitals

This one brings in a little quantum chemistry. The code is not deriving orbitals from first principles, but it does borrow the familiar angular shapes and phase structure of the `s`, `p`, and `d` orbitals. The positive and negative regions are shown with different colors, which is a simple way to communicate orbital sign.

The two main helpers are `OrbitalLobe` and `OrbGraph`. `OrbitalLobe` wraps [SymSpline](/docs/SymSpline) and turns a radial profile plus an angular interval into one filled lobe. `OrbGraph` provides a common [Graph](/docs/Graph) container with fixed coordinates, dashed axes, and a central dot, so each orbital can be built by composing lobes rather than rebuilding the same frame each time.

The final layout is also worth noting. Since the figure really wants an uneven `1 / 3 / 2` arrangement, a rigid grid with spacers would be awkward. Instead the slide uses a **VStack** of **HWrap** rows, and **HWrap**'s aspect-based spacing keeps the square boxes lined up cleanly even though each row has a different number of cells.