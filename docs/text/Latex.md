# Latex

*Inherits*: [MathText](/docs/MathText) > [HStack](/docs/HStack) > [Group](/docs/Group) > [Element](/docs/Element)

Parses a LaTeX string with KaTeX and converts it into gum math elements such as [Frac](/docs/Frac), radical layouts, and [Bracket](/docs/Bracket). If parsing fails, the raw source is displayed in red so the error is visible in the output.

Parameters:
- `children` — the LaTeX source string
- `inline` = `false` — shorthand for selecting `style="text"` when no explicit style is provided
- `style` — explicit TeX math style; defaults to `display`, or `text` when `inline` is true
- `strut` = `true` — reserve a minimum top-level math line box
- any [MathText](/docs/MathText) layout parameters are also accepted
