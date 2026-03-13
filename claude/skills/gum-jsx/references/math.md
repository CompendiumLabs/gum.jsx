# Math Elements

## Latex

*Inherits*: **MathText** > **HStack** > **Group** > **Element**

Parses a LaTeX string with KaTeX and converts it into gum math elements such as **Frac**, radical layouts, and **Bracket**. If parsing fails, the raw source is displayed in red so the error is visible in the output.

Parameters:
- `children` — the LaTeX source string
- any **MathText** layout parameters are also accepted

**Example**

Prompt: There are two latex equations framed by rounded borders arranged vertically. The top one shows a Gaussian integral and the bottom one shows a trigonometric identity. They are framed by a square with the title "Facts".

Generated code:
```jsx
<VStack spacing>
  <TextFrame rounded>
    <Latex>{"\\int_0^{\\infty} \\exp(-x^2) dx = \\sqrt{\\pi}"}</Latex>
  </TextFrame>
  <TextFrame rounded>
    <Latex>{"\\sin^2(\\theta) + \\cos^2(\\theta) = 1"}</Latex>
  </TextFrame>
</VStack>
```

## MathText

*Inherits*: **HStack** > **Group** > **Element**

Arranges math items in a horizontal row with automatic inter-atom spacing. Strings, numbers, and booleans are automatically converted to math symbols, nested **MathText** is flattened, and ordinary gum **Element** values can be mixed inline as well.

For math-to-math neighbors, spacing is derived from atom classes like `mord`, `mbin`, and `mrel`. For mixed or non-math neighbors, the fallback `spacing` value is used.

Parameters:
- `children` — math items, nested arrays of math items, or ordinary `Element`s
- `spacing` = `0.25` — default spacing used between non-math neighbors and mixed math/non-math neighbors
- `vshift` = `0.1` — vertical shift applied to the rendered row
- all usual stack layout parameters are also accepted

**Example**

Prompt: a MathText row with a blue square inserted between an equals sign and y

Generated code:
```jsx
<TextFrame rounded>
  <MathText>
    <MathSymbol>x</MathSymbol>
    <MathSymbol>{'='}</MathSymbol>
    <Square fill={blue} />
    <MathSymbol>y</MathSymbol>
  </MathText>
</TextFrame>
```

## SupSub

*Inherits*: **HStack** > **Group** > **Element**

Places a superscript and subscript stack to the right of a base expression. The base comes from `children`, and `sup` / `sub` can be either elements or scalar values, which are automatically wrapped as math symbols.

Parameters:
- `children` — a single base element
- `sup` / `sub` — the superscript and subscript content
- `hspacing` = `0.025` — horizontal gap between the base and the script stack
- `vspacing` = `-0.025` — spacing between the superscript and subscript rows
- `vshift` = `0.025` — vertical offset applied to the script stack

**Example**

Prompt: x squared with an i subscript

Generated code:
```jsx
<TextFrame rounded>
  <MathText>
    <SupSub sup="2" sub="i">
      <MathSymbol>x</MathSymbol>
    </SupSub>
  </MathText>
</TextFrame>
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
<TextFrame rounded>
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
</TextFrame>
```

## Bracket

*Inherits*: **HStack** > **Group** > **Element**

Wraps a single child in a matched pair of delimiters. The delimiter can be chosen from a preset name or given as a pair to mix left and right shapes.

Parameters:
- `children` — a single element to enclose
- `delim` = `'round'` — one of `'round'`, `'square'`, `'curly'`, `'angle'`, or a `[left, right]` pair of those values

Subunit names:
- `delim` — forwarded to the generated delimiter symbols, for example `delim_size`

**Example**

Prompt: a square-bracketed sum

Generated code:
```jsx
<TextFrame rounded>
  <Bracket delim="square">
    <MathText>
      <MathSymbol>x</MathSymbol>
      <MathSymbol>{'+'}</MathSymbol>
      <MathSymbol>y</MathSymbol>
    </MathText>
  </Bracket>
</TextFrame>
```
