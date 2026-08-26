# Accent

*Inherits*: **MathGroup** > [Group](/docs/Group) > [Element](/docs/Element)

Sets an accent glyph over a base, as [Latex](/docs/Latex) does for `\hat{x}`, `\vec{v}`, `\bar{y}`, `\tilde{n}`, `\dot{q}` and the other accent commands. The accent is centered over the base and raised to clear it: it sits at its designed height over an x-height base and is lifted for taller bases, following TeX's accent rule. The accented atom keeps the base's spacing class, so it spaces like the base would on its own.

The accent is named by its LaTeX command in `label`. The wide accents (`\widehat`, `\widetilde`, `\widecheck`) use the same glyph as their narrow forms here; the stretchy arrow accents (`\overrightarrow` and friends) are drawn by [MathStretch](/docs/MathStretch) instead. Text-mode accents such as `\'`, `\"` and `\c` live in the text symbol table and need `mode="text"`.

Parameters:
- `children` — the base, a LaTeX string or a single math element
- `label` — the accent command, such as `\hat`, `\bar`, `\tilde`, `\vec`, `\dot`, `\ddot`, `\check`, `\breve`, `\acute`, or `\grave`
- `mode` = `math` — the symbol table to look the accent up in, `math` or `text`
- `color` — the colour of the accent glyph
