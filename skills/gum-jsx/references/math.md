# Math Elements

## Latex

*Inherits*: **MathText** > **HStack** > **Group** > **Element**

Parses a LaTeX string with KaTeX and converts it into gum math elements such as **Frac**, radical layouts, and **Bracket**. If parsing fails, the raw source is displayed in red so the error is visible in the output.

Parameters:
- `children` — the LaTeX source string
- `inline` = `false` — shorthand for selecting `style="text"` when no explicit style is provided
- `style` — explicit TeX math style; defaults to `display`, or `text` when `inline` is true
- `strut` = `true` — reserve a minimum top-level math line box
- any **MathText** layout parameters are also accepted

**Example**

Prompt: There are two latex equations framed by rounded borders arranged vertically. The top one shows a Gaussian integral and the bottom one shows a trigonometric identity. They are framed by a square with the title "Facts".

Generated code:
```jsx
<VStack spacing>
  <Frame padding rounded border={2}>
    <Latex>{"\\int_0^{\\infty} \\exp(-x^2) dx = \\sqrt{\\pi}"}</Latex>
  </Frame>
  <Frame padding rounded border={2}>
    <Latex>{"\\sin^2(\\theta) + \\cos^2(\\theta) = 1"}</Latex>
  </Frame>
</VStack>
```

## MathText

*Inherits*: **HStack** > **Group** > **Element**

Arranges math items in a horizontal row with automatic inter-atom spacing. Strings and numbers are parsed as LaTeX (as in **Latex**), nested **MathText** is flattened, and ordinary gum **Element** values can be mixed inline as well.

For math-to-math neighbors, spacing is derived from atom classes like `mord`, `mbin`, and `mrel`. For mixed or non-math neighbors, the fallback `spacing` value is used.

Parameters:
- `children` — math items, nested arrays of math items, or ordinary `Element`s
- `spacing` = `0.25` — default spacing used between non-math neighbors and mixed math/non-math neighbors
- `style` = `text` — TeX style used when parsing string and scalar children
- `strut` = `false` — reserve a minimum top-level math line box
- all usual stack layout parameters are also accepted

**Example**

Prompt: a MathText row expressing "alpha = blue x red" where blue and red are represented by squares

Generated code:
```jsx
<Frame padding rounded>
  <MathText>
    <MathSymbol>\alpha</MathSymbol>
    <MathSymbol>=</MathSymbol>
    <Square rounded fill={blue} />
    <MathSymbol>\times</MathSymbol>
    <Square rounded fill={red} />
  </MathText>
</Frame>
```

## SupSub

*Inherits*: **MathText** > **Group** > **Element**

Attaches a superscript and/or subscript to a base expression. The base comes from `children`, and `sup` / `sub` can be either elements or strings, which are parsed as LaTeX (so `sub="i=0"` or `sup="n+1"` work directly). Scripts are rendered one style level down and shifted following the TeX rules. When the base is a `MathOp` that takes limits in display style (such as `\sum`, `\prod`, or `\lim`), the scripts are stacked above and below the operator instead of placed to its right; this can be forced either way with `limits`.

Parameters:
- `children` — a single base element
- `sup` / `sub` — the superscript and subscript content
- `style` = `text` — the math style of the base (`display`, `text`, `script`, or `scriptscript`)
- `limits` — stack scripts above and below the base (defaults to the base operator's `limits` flag)

**Example**

Prompt: x squared with an i subscript

Generated code:
```jsx
<Frame padding rounded border={10} fill={gray} margin>
  <MathText>
    <SupSub sup="2" sub="i">
      <MathSymbol>x</MathSymbol>
    </SupSub>
  </MathText>
</Frame>
```

## Frac

*Inherits*: **Box** > **Group** > **Element**

Builds a numerator-over-denominator fraction. Pass the numerator and denominator as the two children. By default a horizontal bar is drawn between them, but it can be omitted for binomial-style layouts.

Parameters:
- `children` — `[numerator, denominator]`
- `has-bar` = `true` — whether to draw the fraction bar
- `padding` = `0.1` — padding applied around numerator and denominator
- `rule-size` = `0.005` — thickness of the fraction bar

**Example**

Prompt: a fraction with x + 1 over y - 1

Generated code:
```jsx
<Frac>
  <MathText>
    <MathSymbol>x</MathSymbol>
    <MathSymbol>{'+'}</MathSymbol>
    <MathSymbol>1</MathSymbol>
  </MathText>
  <MathText>
    <MathSymbol>y</MathSymbol>
    <MathSymbol>{'-'}</MathSymbol>
    <MathSymbol>1</MathSymbol>
  </MathText>
</Frac>
```

## Bracket

*Inherits*: **HStack** > **Group** > **Element**

Wraps a single child in a matched pair of delimiters. The delimiter can be chosen from a preset name or given as a pair to mix left and right shapes.

Parameters:
- `children` — a single element to enclose
- `delim` = `'round'` — one of `'round'`, `'square'`, `'curly'`, `'angle'`, or a `[left, right]` pair of those values

Subunit names:
- `delim` — forwarded to the generated delimiter symbols, for example `delim-level`

**Example**

Prompt: the ratio of alpha to beta enclosed in parentheses

Generated code:
```jsx
<Bracket>
  <Frac>
    <MathSymbol>\alpha</MathSymbol>
    <MathSymbol>\beta</MathSymbol>
  </Frac>
</Bracket>
```
