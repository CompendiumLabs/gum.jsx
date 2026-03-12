# Latex

*Inherits*: [MathText](/docs/MathText) > [HStack](/docs/HStack) > [Group](/docs/Group) > [Element](/docs/Element)

Parses a LaTeX string with KaTeX and converts it into gum math elements such as [Frac](/docs/Frac), radical layouts, and [Bracket](/docs/Bracket). If parsing fails, the raw source is displayed in red so the error is visible in the output.

Parameters:
- `children` — the LaTeX source string
- any [MathText](/docs/MathText) layout parameters are also accepted
