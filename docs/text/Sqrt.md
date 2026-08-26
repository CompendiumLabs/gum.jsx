# Sqrt

*Inherits*: **MathGroup** > [Group](/docs/Group) > [Element](/docs/Element)

Draws a radical: a surd glyph beside the body with a rule extending over it. The radical is chosen from the KaTeX size fonts as the smallest one that covers the body, so a tall radicand (a fraction, say) gets a taller surd rather than a stretched one. An optional `index` is set at script size in the crook of the surd, as in a cube root. This is what [Latex](/docs/Latex) produces for `\sqrt` and `\sqrt[n]`.

The body is a single child: a LaTeX string, which is parsed as in [Latex](/docs/Latex), or any math element. It is set in the cramped version of `style`, so its superscripts sit lower, as TeX does.

Parameters:
- `children` — the radicand, a LaTeX string or a single math element
- `index` — an optional index, a LaTeX string or a math element, placed above and to the left of the surd at script-script size
- `rule-size` = `0.04` — the thickness of the rule over the body in em (`line-width` is accepted as an alias)
- `padding` = `0` — padding around the body, in em
- `style` = `text` — the TeX math style to set the body in
- `color` — the colour of the surd and rule (the body's text takes it too)
