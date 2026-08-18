# SupSub

*Inherits*: [MathText](/docs/MathText) > [Group](/docs/Group) > [Element](/docs/Element)

Attaches a superscript and/or subscript to a base expression. The base comes from `children`, and `sup` / `sub` can be either elements or strings, which are parsed as LaTeX (so `sub="i=0"` or `sup="n+1"` work directly). Scripts are rendered one style level down and shifted following the TeX rules. When the base is a `MathOp` that takes limits in display style (such as `\sum`, `\prod`, or `\lim`), the scripts are stacked above and below the operator instead of placed to its right; this can be forced either way with `limits`.

Parameters:
- `children` — a single base element
- `sup` / `sub` — the superscript and subscript content
- `style` = `text` — the math style of the base (`display`, `text`, `script`, or `scriptscript`)
- `limits` — stack scripts above and below the base (defaults to the base operator's `limits` flag)
