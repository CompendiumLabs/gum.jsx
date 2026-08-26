# HorizBrace

*Inherits*: **MathGroup** > [Group](/docs/Group) > [Element](/docs/Element)

Draws a horizontal curly brace over or under its body, with an optional label riding beyond the brace, as [Latex](/docs/Latex) does for `\overbrace{...}^{label}` and `\underbrace{...}_{label}`. The brace is drawn (see [MathStretch](/docs/MathStretch)) to the width of the body, down to a floor so a brace over a single letter does not collapse into a squiggle, and the body keeps its own baseline. The braced atom is an inner atom, so it spaces like a delimited group.

The body is set in display style, as TeX does, so operators inside it take limits and fractions stay full size; a script `style` is kept as is. The label is set at script size, like the script it is written as in TeX, and a string label is parsed in that script style.

Parameters:
- `children` — the body, a LaTeX string or a single math element
- `label` — an optional label beyond the brace, a LaTeX string or a math element (such as a [TextMode](/docs/TextMode))
- `over` = `true` — whether the brace goes over (`true`) or under (`false`) the body
- `style` = `text` — the TeX math style in force
- `height` = `0.548` — the height of the brace in em
- `thickness` = `0.1` — the thickness of the brace strokes in em
- `color` — the colour of the brace
