# TextMode

*Inherits*: [MathText](/docs/MathText) > [HStack](/docs/HStack) > [Group](/docs/Group) > [Element](/docs/Element)

Sets plain text inside math, the way `\text{...}` does. String children are shown literally (they are not parsed as LaTeX), upright in the text face composed from `family`, `bold`, and `italic`, with spaces kept. Ordinary gum [Element](/docs/Element) values can be mixed inline as in [MathText](/docs/MathText), which is also how to put math between words.

Parameters:
- `children` — text strings, or ordinary `Element`s
- `family` = `main` — the text family: `main` (roman), `sans`, or `mono`
- `bold` = `false` — set the text in the bold face
- `italic` = `false` — set the text in the italic face
- `style` = `text` — TeX style, which governs the inter-atom spacing
- `strut` = `false` — reserve a minimum top-level math line box
- any [MathText](/docs/MathText) layout parameters are also accepted
