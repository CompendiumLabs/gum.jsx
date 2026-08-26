# Math Elements

## Latex

*Inherits*: **MathText** > **HStack** > **Group** > **Element**

Parses a LaTeX string with KaTeX and converts it into gum math elements such as **Frac**, radical layouts, and **Bracket**. If parsing fails, the raw source is displayed in red so the error is visible in the output. **Tex** is the same element with `inline` defaulting to `true`, for math set in text style.

Parameters:
- `children` — the LaTeX source string
- `inline` = `false` — shorthand for selecting `style="text"` when no explicit style is provided
- `style` — explicit TeX math style; defaults to `display`, or `text` when `inline` is true
- `strut` = `true` — reserve a minimum top-level math line box
- any **MathText** layout parameters are also accepted

**Example**

Prompt: There are two latex equations framed by rounded borders arranged vertically. The top one shows a Gaussian integral and the bottom one shows a trigonometric identity.

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

## TextMode

*Inherits*: **MathText** > **HStack** > **Group** > **Element**

Sets plain text inside math, the way `\text{...}` does. String children are shown literally (they are not parsed as LaTeX), upright in the text face composed from `family`, `bold`, and `italic`, with spaces kept. Ordinary gum **Element** values can be mixed inline as in **MathText**, which is also how to put math between words.

Parameters:
- `children` — text strings, or ordinary `Element`s
- `family` = `main` — the text family: `main` (roman), `sans`, or `mono`
- `bold` = `false` — set the text in the bold face
- `italic` = `false` — set the text in the italic face
- `style` = `text` — TeX style, which governs the inter-atom spacing
- `strut` = `false` — reserve a minimum top-level math line box
- any **MathText** layout parameters are also accepted

**Example**

Prompt: a math row with upright text between the symbols, one word in bold, above a sans-serif note with a variable in it

Generated code:
```jsx
<Frame padding rounded>
  <VStack spacing={0.1}>
    <MathText>
      {"x = 1"}
      <TextMode> if </TextMode>
      {"y > 0"}
      <TextMode>, and </TextMode>
      <TextMode bold>otherwise </TextMode>
      {"x = 0"}
    </MathText>
    <MathText>
      <TextMode family="sans">(where </TextMode>
      {"y"}
      <TextMode family="sans"> is the input and </TextMode>
      {"x"}
      <TextMode family="sans"> the output)</TextMode>
    </MathText>
  </VStack>
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

## Sqrt

*Inherits*: **MathGroup** > **Group** > **Element**

Draws a radical: a surd glyph beside the body with a rule extending over it. The radical is chosen from the KaTeX size fonts as the smallest one that covers the body, so a tall radicand (a fraction, say) gets a taller surd rather than a stretched one. An optional `index` is set at script size in the crook of the surd, as in a cube root. This is what **Latex** produces for `\sqrt` and `\sqrt[n]`.

The body is a single child: a LaTeX string, which is parsed as in **Latex**, or any math element. It is set in the cramped version of `style`, so its superscripts sit lower, as TeX does.

Parameters:
- `children` — the radicand, a LaTeX string or a single math element
- `index` — an optional index, a math element (such as a **MathText**), placed above and to the left of the surd at script-script size
- `rule-size` = `0.04` — the thickness of the rule over the body in em (`line-width` is accepted as an alias)
- `padding` = `0` — padding around the body, in em
- `style` = `text` — the TeX math style to set the body in
- `color` — the colour of the surd and rule (the body's text takes it too)

**Example**

Prompt: square roots of a short and a tall body, and a cube root with an index

Generated code:
```jsx
<MathText>
  <Sqrt>{"x^2 + y^2"}</Sqrt>
  <MathSymbol>+</MathSymbol>
  <Sqrt>{"\\frac{a}{b}"}</Sqrt>
  <MathSymbol>+</MathSymbol>
  <Sqrt index={<MathSymbol>3</MathSymbol>}>z</Sqrt>
</MathText>
```

## Accent

*Inherits*: **MathGroup** > **Group** > **Element**

Sets an accent glyph over a base, as **Latex** does for `\hat{x}`, `\vec{v}`, `\bar{y}`, `\tilde{n}`, `\dot{q}` and the other accent commands. The accent is centered over the base and raised to clear it: it sits at its designed height over an x-height base and is lifted for taller bases, following TeX's accent rule. The accented atom keeps the base's spacing class, so it spaces like the base would on its own.

The accent is named by its LaTeX command in `label`. The wide accents (`\widehat`, `\widetilde`, `\widecheck`) use the same glyph as their narrow forms here; the stretchy arrow accents (`\overrightarrow` and friends) are drawn by **MathStretch** instead. Text-mode accents such as `\'`, `\"` and `\c` live in the text symbol table and need `mode="text"`.

Parameters:
- `children` — the base, a LaTeX string or a single math element
- `label` — the accent command, such as `\hat`, `\bar`, `\tilde`, `\vec`, `\dot`, `\ddot`, `\check`, `\breve`, `\acute`, or `\grave`
- `mode` = `math` — the symbol table to look the accent up in, `math` or `text`
- `color` — the colour of the accent glyph

**Example**

Prompt: the common accents set over single letters, and a hat over a taller base

Generated code:
```jsx
<MathText>
  <Accent label="\hat">x</Accent>
  <MathSymbol>+</MathSymbol>
  <Accent label="\bar">y</Accent>
  <MathSymbol>+</MathSymbol>
  <Accent label="\tilde">n</Accent>
  <MathSymbol>+</MathSymbol>
  <Accent label="\dot">q</Accent>
  <MathSymbol>+</MathSymbol>
  <Accent label="\vec" color={blue}>v</Accent>
  <MathSymbol>+</MathSymbol>
  <Accent label="\hat">{"A^2"}</Accent>
</MathText>
```

## Overline

*Inherits*: **MathGroup** > **Group** > **Element**

Draws a rule over its body, spanning the body's full width and clearing its full height, as **Latex** does for `\overline`. The companion **Underline** draws the rule beneath the body instead, below its full depth, for `\underline`. Both take the same parameters. The body of an `Overline` is set in the cramped version of `style`, as TeX does for anything with something above it, so its superscripts sit lower; an `Underline` leaves the style alone.

Either can be nested in the other or in itself, and they compose with the other math elements: an overline over a **Frac** or **Sqrt** spans the whole construction.

Parameters:
- `children` — the body, a LaTeX string or a single math element
- `thickness` = `0.04` — the thickness of the rule in em
- `style` = `text` — the TeX math style to set the body in
- `color` — the colour of the rule (the body's text takes it too)

**Example**

Prompt: an overline and an underline, each spanning a body with height or depth, and

Generated code:
```jsx
// a red overline drawn over a fraction
<MathText>
  <Overline>{"x^2 + y"}</Overline>
  <MathSymbol>+</MathSymbol>
  <Underline>{"g_y + z"}</Underline>
  <MathSymbol>=</MathSymbol>
  <Overline color={red}>{"\\frac{a}{b}"}</Overline>
</MathText>
```

## HorizBrace

*Inherits*: **MathGroup** > **Group** > **Element**

Draws a horizontal curly brace over or under its body, with an optional label riding beyond the brace, as **Latex** does for `\overbrace{...}^{label}` and `\underbrace{...}_{label}`. The brace is drawn (see **MathStretch**) to the width of the body, down to a floor so a brace over a single letter does not collapse into a squiggle, and the body keeps its own baseline. The braced atom is an inner atom, so it spaces like a delimited group.

The body is set in display style, as TeX does, so operators inside it take limits and fractions stay full size; a script `style` is kept as is. The label is set at script size, like the script it is written as in TeX, and a string label is parsed in that script style.

Parameters:
- `children` — the body, a LaTeX string or a single math element
- `label` — an optional label beyond the brace, a LaTeX string or a math element (such as a **TextMode**)
- `over` = `true` — whether the brace goes over (`true`) or under (`false`) the body
- `style` = `text` — the TeX math style in force
- `height` = `0.548` — the height of the brace in em
- `thickness` = `0.1` — the thickness of the brace strokes in em
- `color` — the colour of the brace

**Example**

Prompt: an overbrace with a label counting its terms, and an underbrace naming a tail

Generated code:
```jsx
<MathText>
  <HorizBrace label="n">{"a + b + c"}</HorizBrace>
  <MathSymbol>+</MathSymbol>
  <HorizBrace over={false} label={<TextMode>tail</TextMode>} color={blue}>{"y + z"}</HorizBrace>
</MathText>
```

## MathStretch

*Inherits*: **MathShape** > **Group** > **Element**

Draws one of the stretchy math decorations: the braces, the stretchy arrow accents (`\overrightarrow`, `\underleftarrow`, `\overleftharpoon`, …), the line segments and groups (`\overlinesegment`, `\overgroup`, `\utilde`), and the extensible arrows (`\xrightarrow`, `\xmapsto`, `\xrightleftharpoons`, `\xlongequal`, …). No font carries stretchable versions of these, so gum draws them from its own shape table, keyed by the KaTeX command name, using KaTeX's heights and minimum widths. The arrows are gum's own **Arrow** and **ArrowHead** with barbs matching Computer Modern; the braces are filled outlines.

This is the bare decoration. **Latex** places it over or under a body, stretched to the body's width, and **HorizBrace** does the same for a brace with a label. On its own it is a math item of the given width and its natural height that can be dropped into a **MathText**, which is handy for a long arrow between two expressions.

Parameters:
- `label` = `overbrace` — the decoration to draw, named by its LaTeX command with or without the backslash: one of `overbrace`, `underbrace`, `overrightarrow`, `overleftarrow`, `underrightarrow`, `underleftarrow`, `overleftrightarrow`, `underleftrightarrow`, `Overrightarrow`, `overleftharpoon`, `overrightharpoon`, `overlinesegment`, `underlinesegment`, `overgroup`, `undergroup`, `utilde`, `xrightarrow`, `xleftarrow`, `xleftrightarrow`, `xRightarrow`, `xLeftarrow`, `xLeftrightarrow`, `xlongequal`, `xtwoheadrightarrow`, `xtwoheadleftarrow`, `xrightharpoonup`, `xrightharpoondown`, `xleftharpoonup`, `xleftharpoondown`, `xhookrightarrow`, `xhookleftarrow`, `xmapsto`, `xrightleftharpoons`, `xleftrightharpoons`, `xrightleftarrows`, `xtofrom`, `xrightequilibrium`, `xleftequilibrium`
- `advance` — the width in em; the decoration's minimum width is used if this is smaller or absent
- `height` — the height in em; defaults to the decoration's natural height
- `thickness` — the stroke thickness in em; defaults to a TeX rule (`0.04`) for the arrows and lines, and the brace's own band for the braces
- `fill` — the colour of the shape (`color` is accepted as an alias)

**Example**

Prompt: standalone decorations as math items: a long arrow between two expressions,

Generated code:
```jsx
// a double-headed arrow, and a brace
<MathCol spacing={0.3}>
  <MathText>
    <MathSymbol>f</MathSymbol>
    <MathStretch label="xrightarrow" advance={2} />
    <MathSymbol>g</MathSymbol>
    <MathStretch label="xLeftrightarrow" advance={1.5} fill={blue} />
    <MathSymbol>h</MathSymbol>
  </MathText>
  <MathStretch label="overbrace" advance={3} fill={red} />
</MathCol>
```

## MathArray

*Inherits*: **Group** > **Element**

Lays out math cells in rows and columns, following LaTeX's `array` metrics: every row gets a strut so short rows still take a full line, columns are as wide as their widest cell and separated by `\arraycolsep`, and the whole array is centered on the math axis. This is what **Latex** builds for every tabular environment, from `matrix` and `pmatrix` through `cases`, `aligned` and `array`, with `\hline`/`\hdashline` and the `|`/`:` column separators.

From JSX the cells can be given as a flat list plus `ncol`, which is reshaped into rows the way **Grid** does (nested arrays in JSX children are flattened), or as a list of rows. Each cell is a math element; wrap a LaTeX string in a **MathText** to use it as a cell. The array has no delimiters of its own; wrap it in a **Bracket** for a `pmatrix` or `bmatrix`, which stretches its delimiters to the array's height.

Parameters:
- `children` — the cells, either a flat list chunked by `ncol` or a list of rows
- `ncol` — the number of columns to chunk a flat list of cells into; defaults to the number of aligned columns in `cols`, else `1`
- `cols` — the column descriptors, in order, as objects: `{ type: 'align', align: 'l' | 'c' | 'r' }` for a column (with optional `pregap`/`postgap` in em) and `{ type: 'separator', separator: '|' | ':' }` for a solid or dashed rule between columns. Columns beyond the descriptors are centered
- `stretch` = `1` — the row spacing multiplier, LaTeX's `\arraystretch`
- `jot` = `false` — add `\jot` of extra leading between rows, as the AMS `aligned`/`gathered` environments do
- `colsep` = `0.5` — the space on either side of each column in em, LaTeX's `\arraycolsep`
- `outer` = `false` — whether to pad the outer edges by `colsep` as well
- `hlines` — a list with one entry per row boundary (before the first row through after the last), each a list of rules to draw there, `true` for dashed and `false` for solid
- `rowgaps` — extra depth to add after each row in em, like `\\[len]`
- `thickness` = `0.04` — the thickness of the rules in em
- `fill` — the colour of the rules (`color` is accepted as an alias)

**Example**

Prompt: a 2x2 matrix in parentheses, and a right-aligned table with a rule between

Generated code:
```jsx
// its rows and a dashed rule between its columns
const cell = s => <MathText>{s}</MathText>
return <MathText spacing={1}>
  <Bracket>
    <MathArray ncol={2}>{['a', 'b', 'c', 'd'].map(cell)}</MathArray>
  </Bracket>
  <MathArray
    cols={[{ type: 'align', align: 'r' }, { type: 'separator', separator: ':' }, { type: 'align', align: 'r' }]}
    hlines={[[], [false], []]}
  >
    {['x', '100', 'y^2', '5'].map(cell)}
  </MathArray>
</MathText>
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
