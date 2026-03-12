# Frac

*Inherits*: [Box](/docs/Box) > [Group](/docs/Group) > [Element](/docs/Element)

Builds a numerator-over-denominator fraction. Pass the numerator and denominator as the two children. By default a horizontal bar is drawn between them, but it can be omitted for binomial-style layouts.

Parameters:
- `children` — `[numerator, denominator]`
- `has-bar` = `true` — whether to draw the fraction bar
- `padding` = `0.1` — padding applied around numerator and denominator
- `rule-size` = `0.005` — thickness of the fraction bar
