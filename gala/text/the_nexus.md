# The Nexus

This is a simple but effective generative plot. Each curve is the same damped cosine profile with a different phase shift, and the whole bundle is produced by mapping over a list of phase values.

The visual style comes from a few restrained choices. The axes are turned off (`axis = false`), the dense grid is left on, and the stroke colors are interpolated from red to blue across the family of curves with `interp`. That is enough to make the figure feel atmospheric without requiring any extra structure beyond a loop over [SymSpline](/docs/SymSpline) elements.