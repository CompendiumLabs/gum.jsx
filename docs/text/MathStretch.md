# MathStretch

*Inherits*: **MathShape** > [Group](/docs/Group) > [Element](/docs/Element)

Draws one of the stretchy math decorations: the braces, the stretchy arrow accents (`\overrightarrow`, `\underleftarrow`, `\overleftharpoon`, …), the line segments and groups (`\overlinesegment`, `\overgroup`, `\utilde`), and the extensible arrows (`\xrightarrow`, `\xmapsto`, `\xrightleftharpoons`, `\xlongequal`, …). No font carries stretchable versions of these, so gum draws them from its own shape table, keyed by the KaTeX command name, using KaTeX's heights and minimum widths. The arrows are gum's own [Arrow](/docs/Arrow) and [ArrowHead](/docs/ArrowHead) with barbs matching Computer Modern; the braces are filled outlines.

This is the bare decoration. [Latex](/docs/Latex) places it over or under a body, stretched to the body's width, and [HorizBrace](/docs/HorizBrace) does the same for a brace with a label. On its own it is a math item of the given width and its natural height that can be dropped into a [MathText](/docs/MathText), which is handy for a long arrow between two expressions.

Parameters:
- `label` = `overbrace` — the decoration to draw, named by its LaTeX command with or without the backslash: one of `overbrace`, `underbrace`, `overrightarrow`, `overleftarrow`, `underrightarrow`, `underleftarrow`, `overleftrightarrow`, `underleftrightarrow`, `Overrightarrow`, `overleftharpoon`, `overrightharpoon`, `overlinesegment`, `underlinesegment`, `overgroup`, `undergroup`, `utilde`, `xrightarrow`, `xleftarrow`, `xleftrightarrow`, `xRightarrow`, `xLeftarrow`, `xLeftrightarrow`, `xlongequal`, `xtwoheadrightarrow`, `xtwoheadleftarrow`, `xrightharpoonup`, `xrightharpoondown`, `xleftharpoonup`, `xleftharpoondown`, `xhookrightarrow`, `xhookleftarrow`, `xmapsto`, `xrightleftharpoons`, `xleftrightharpoons`, `xrightleftarrows`, `xtofrom`, `xrightequilibrium`, `xleftequilibrium`
- `advance` — the width in em; the decoration's minimum width is used if this is smaller or absent
- `height` — the height in em; defaults to the decoration's natural height
- `thickness` — the stroke thickness in em; defaults to a TeX rule (`0.04`) for the arrows and lines, and the brace's own band for the braces
- `fill` — the colour of the shape (`color` is accepted as an alias)
