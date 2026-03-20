# Particle in a Box

This is a nice example of using [Plot](/docs/Plot) for something diagrammatic rather than data-driven. The x-axis still represents position in the box, but the y direction is really just a stacking direction for the different energy levels. Each state gets a faint horizontal baseline, a sinusoidal [SymSpline](/docs/SymSpline), and matching math labels, so the final figure reads more like a textbook plate than an ordinary graph.

One useful trick here is that the wavefunctions are not plotted around zero. Each one is shifted upward by `(i + 0.5) * sp`, which lets the same sine profile represent several eigenstates in one frame without overlap. That same offset is reused for the level lines and for the `n = ...` and `E_n` labels, so all three layers stay aligned if you change the spacing or number of states.

The box itself is also built from very simple pieces. Two thick vertical walls define the well, and the diagonal hatching outside them is just a loop over basic [Line](/docs/Line) elements. Combined with the black-and-white palette and the final [Latex](/docs/Latex) formula at the bottom, that gives the whole example its old textbook look.
