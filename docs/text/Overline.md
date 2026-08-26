# Overline

*Inherits*: **MathGroup** > [Group](/docs/Group) > [Element](/docs/Element)

Draws a rule over its body, spanning the body's full width and clearing its full height, as [Latex](/docs/Latex) does for `\overline`. The companion **Underline** draws the rule beneath the body instead, below its full depth, for `\underline`. Both take the same parameters. The body of an `Overline` is set in the cramped version of `style`, as TeX does for anything with something above it, so its superscripts sit lower; an `Underline` leaves the style alone.

Either can be nested in the other or in itself, and they compose with the other math elements: an overline over a [Frac](/docs/Frac) or [Sqrt](/docs/Sqrt) spans the whole construction.

Parameters:
- `children` — the body, a LaTeX string or a single math element
- `thickness` = `0.04` — the thickness of the rule in em
- `style` = `text` — the TeX math style to set the body in
- `color` — the colour of the rule (the body's text takes it too)
