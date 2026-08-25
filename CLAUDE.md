# `gum.jsx` Framework

`gum.jsx` is a language for creating visualizations using a React-like JSX dialect that evaluates into SVG. It's designed for creating general graphics, plots, graphs, and network diagrams. The language supports declarative component-based rendering with automatic layout and coordinate system mapping.

## Commands

### Running the CLI

To test the output of a particular `gum.jsx` snippet or file, you can pipe it to the `gum` command. If you have vision capabilities, this can be useful for see the actual output of the code, either in SVG or PNG format.

```bash
# Generate SVG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum -f svg

# Generate SVG from a gum.jsx snippet and save to file
echo '<Rectangle rounded fill={blue} />' | bun run cli -o test.svg

# Generate PNG from a gum.jsx snippet and save to file
echo '<Rectangle rounded fill={blue} />' | bun run cli -o test.png

# Generate SVG from a .jsx file and save to file
gum test.jsx -o test.svg

# Generate PNG from a .jsx file and save to file
gum test.jsx -o test.png

# Run options:
# file: gum.jsx file to render (reads from stdin if not provided)
# -s, --size <size>        size of the svg/viewBox (default: 1000)
# -r, --raster-size <size> max rasterized PNG size (default: null)
# -f, --format <format>    format: svg, png, kitty (default: kitty or inferred)
# -t, --theme <theme>      theme to use (default: light)
# -b, --background <color> background color (default: white)
# -o, --output <output>    output file (default: null)
# --strict                 throw on rendering fallbacks instead of drawing them
# --seed <seed>            seed for random/uniform/normal/integer (default: 42)
```

### Math CLI

The LaTeX pipeline is exposed standalone via `src/math.ts` (`mathToElement`, `mathToSvg`; exported as `gum/math`, browser-safe) and `src/render.ts` (`mathToPng`, `mathToKitty`; exported as `gum/render`, node only) and the `gum-tex` CLI (`scripts/math.ts`). By default output is sized naturally to the math at `font_size` pixels per em (with `padding` in em); `size` instead fits the math into an overall box:

```bash
# Render LaTeX to SVG/PNG (or kitty terminal image if no output/format given)
gum-tex '\frac{1}{2}' -o half.svg
bun scripts/math.ts -S 32 -t dark -o eq.png < eq.tex
gum-tex 'E = mc^2' -s 400 -o emc.png   # fit into a 400px box
```

### Comparing against katex

`math/compare.ts` renders the same TeX three ways at the same pixels per em — gum
(`mathToPng`), katex's own HTML pipeline in headless Chromium (`renderToString` +
`katex.min.css`, which pulls in the KaTeX fonts), and real LaTeX (`pdflatex` with the
`standalone` class, rasterized by `pdftoppm` at `font_size · 72.27 / 10` dpi so a 10 pt em is
`font_size` px) — trims each to its ink, and stacks them in one PNG (or shows it in a kitty
terminal when no `-o` is given). It needs a Chromium binary on `PATH` (or `--chrome`/
`$GUM_CHROME`) and a TeX install (`--no-latex` skips that panel; it is skipped with a note if
`pdflatex` is missing, and shows the compile error when LaTeX rejects a katex-only command);
the trims and composite are node-canvas. This is the ground truth for layout questions the
metrics checks cannot see, like widths and stroke weights:

```bash
bun math/compare.ts '\xrightarrow{f} \quad \frac{a}{b}' -o cmp.png
bun math/compare.ts -i -S 64 -F eq.tex --packages amsmath,amssymb,mathtools   # inline; extra LaTeX packages
```

Note `katex.min.css` sets `.katex { font-size: 1.21em }`; the script divides the page font size
by 1.21 so both renders share a scale.

### Markdown CLI

`src/mark.ts` (`displayMarkdown`; exported as `gum/mark`) renders Markdown to ANSI terminal text with fenced `gum` blocks, `.png`/`.svg`/`.jsx` images, and `$...$`/`$$...$$` math shown as kitty images. The `gum-down` CLI (`scripts/mark.ts`) wraps it:

```bash
# Display a markdown file in a kitty-compatible terminal
gum-down README.md -t light -w 800
```

### Testing

Run type checking:

```bash
bun tsc --noEmit
```

Test examples are in `docs/code/`, `gala/code/`, and `test/code/` (targeted feature tests, one per file). Run the full test suite:
```bash
bun scripts/test.ts
```

The suite renders every example in **strict mode** (`src/lib/strict.ts`), which turns the
permissive rendering fallbacks into thrown `StrictError`s so silent breakage shows up as a
failure: unparseable TeX (`parse`), a katex node with no gum equivalent (`node`), an unknown
command name drawn verbatim (`symbol`), a TeX font command with no gum face mapped (`font`),
and a character missing from the resolved face (`glyph`). Strict mode is **off by default**
everywhere else; it is a `strict` flag on `evaluateGum`, `mathToElement`/`mathToSvg`/
`mathToPng`/`mathToKitty`, and `--strict` on the `gum` and `gum-tex` CLIs. A failing example
is still rendered permissively for the report, so the card shows the error above the picture.
An example that deliberately exercises a fallback opts out with a `@nostrict` comment.

`math/katex.md` describes how the katex parse tree is converted (metrics, fonts, drawn shapes,
strict mode), the gotchas, the outstanding gaps (`\middle`, `\tag`, `CD` arrows), and which
`test/code/math_*.jsx` file covers what.

Pass `--report` to also render every example in both themes to SVG
(`test/data/<docs|gala|test>/<light|dark>/<name>.svg`) and write
`test/data/manifest.json`, which lists every example with its source, its pass/fail status,
and the paths of the renders that exist (`test/data` is generated and gitignored):
```bash
bun scripts/test.ts --report
```

`test/report` is a Bun + React app that browses that data: a card per example with its
render, a search/group/status filter, a light/dark toggle that switches both the page and
which render is shown, and a full view with the code (highlighted client-side with `shiki`)
beside the picture. It reads `/manifest.json` and fetches the SVG files under `/data/`,
inlining them so they draw with the page's fonts (`src/fonts.css` names IBM Plex out of
`src/fonts` and the KaTeX faces out of the `katex` package). See `test/report/README.md`:
```bash
bun run report   # bun install + dev server in test/report
```

Or test a single file:
```bash
gum docs/code/box.jsx -o test.svg
```

## Architecture

### Fonts

Text layout measures real glyph metrics with opentype.js, so the fonts (`src/fonts/fonts.ts`: IBM Plex Sans/Mono, Noto Emoji, and the KaTeX faces from the `katex` package) must be loaded before elements are constructed. Loading is per family and memoized:

- **node**: nothing to do — fonts are read from disk on first use (`getFont`), so `gum-tex 'x^2'` only parses the KaTeX faces it touches.
- **browser**: fonts are fetched, so hosts must `await loadFonts()` (all core fonts), `await loadMathFonts()` (all 18 KaTeX faces, ~500 kB — enough for `Latex`/`Tex`/`gum/math`), `loadTextFonts()`, or `loadFonts([...names])` before evaluating. `gum/math` kicks off `loadMathFonts()` on import without blocking. A missing font throws `Font not loaded: '<family>'` from `textFont`.

The SVG output references fonts by family name (plus `font-weight`/`font-style` for the bold and italic KaTeX faces); a browser host also needs `@font-face` rules (the URLs are in `FONT_PATHS`) for the glyphs to actually draw. The KaTeX faces are registered under one name per file for measurement (`KaTeX_Main`, `KaTeX_Main-Bold`, `KaTeX_Main-Italic`, `KaTeX_Math-BoldItalic`, `KaTeX_Caligraphic`, `KaTeX_Typewriter`, …), but fontconfig (which the rasterizer uses) and `katex.min.css` know the bold/italic ones as the base family at weight 700 or style italic, so `Span` emits the css face from `fontFace()` and `scripts/test.ts` writes `@font-face` rules the same way.

### Component System

The library is built around a class hierarchy split across element modules:

**Element** (`src/elems/core.ts`) - Base class for all components
- Stores `args` (constructor arguments) as a dictionary for easy cloning
- Has a `spec` object containing layout parameters (rect, coord, aspect, aspect0, expand, align, upright, offset, rotate, rotate_adjust, rotate_invar)
- Has an `attr` object containing SVG attributes (stroke, fill, etc.)
- Renders to SVG via the `svg(ctx)` method that takes a Context object

**Group extends Element** (`src/elems/core.ts`) - Container base class
- Has a `children` array of Elements
- Supports automatic aspect ratio detection (`aspect: 'auto'`)
- Supports automatic coordinate system detection (`coord: 'auto'`)
- Handles clipping and masking

**Layout containers** (`src/elems/layout.ts`):
- `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`
- `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`

**Geometry elements** (`src/elems/geometry.ts`):
- `Line`, `UnitLine`, `VLine`, `HLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`
- `Polygon`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`

**Text elements** (`src/elems/text.ts`):
- `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`, `Latex`, `Equation`

**Plot elements** (`src/elems/plot.ts`):
- `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`

**Network elements** (`src/elems/network.ts`):
- `ArrowSpline`, `Node`, `Edge`, `Network`

**Symbolic elements** (`src/elems/symbolic.ts`):
- `SymPoints`, `SymLine`, `SymSpline`, `SymPoly`, `SymFill`, `SymField`

**Slide elements** (`src/elems/slide.ts`):
- `TitleBox`, `TitleFrame`, `Slide`

### Context System

The `Context` class handles coordinate system mapping:
- Maps from logical coordinates (`coord`) to pixel coordinates (`prect`)
- Handles rotations, aspect ratios, alignments, and expansions
- Pre-computes scalers for performance
- Core method: `map(spec)` transforms child specs into new contexts
- Carries a **stroke unit** (`unit`, pixels per unit of `stroke_width`). The root `Svg` sets it
  from the rendered size (`max(w, h) / D.unit_size`, so `stroke_width = 1` is one pixel at a
  1000px render) and `map()` inherits it unchanged, so strokes scale with the image rather than
  staying a fixed pixel width. `Element.props()` resolves `stroke_width`, `stroke_dasharray` and
  `stroke_dashoffset` against it at emit time, and the root emits a scaled default `stroke-width`
  so implicit strokes scale too. The offset half of an `MNumber` is in the same unit, so
  `Arrow`'s half-a-stroke pullback keeps pace. A container may rebase `unit` to its own box
  (via `ctx.clone({ unit })`) so its strokes scale with its content rather than the image —
  math wants pixels per em. `stroke_width` itself stays a plain number; the scale lives in the
  context, which is what keeps arithmetic like `0.5 * stroke_width` valid.

### Coordinate Systems

Elements can specify positioning via:
- `rect`: logical rectangle `[x1, y1, x2, y2]`
- `coord`: internal coordinate system for children
- `pos` + `rad`: center position and radius (convenience)
- `xlim`/`ylim`: axis limits (convenience)

Key functions for rect manipulation:
- `rect_radial`, `radial_rect` - center/radius format conversion
- `rect_box`, `box_rect` - min/size format conversion
- `merge_rects`, `merge_points` - bounding box calculation
- `expand_rect`, `flip_rect` - transformations

### Evaluation Pipeline

1. **Parse** (`src/lib/parse.ts`): JSX code → AST using Acorn parser
   - Walks the AST and converts JSX elements to `new ComponentName({ ...props })`
   - Handles JSX expressions, spreads, and nested children
   - Imports `KEYS`/`VALS` from `src/gum.ts` to inject all components and utilities as globals

2. **Evaluate** (`src/eval.ts`): AST → Element tree
   - Runs the transformed code to instantiate components
   - Wraps result in `Svg` component if needed
   - Validates that result is an Element

3. **Render** (`src/elems/*.ts`): Element tree → SVG string
   - Each Element's `svg(ctx)` method renders itself
   - Context propagates coordinate transformations down the tree
   - Groups recursively render their children

4. **Rasterize** (`src/render.ts`): SVG string → PNG buffer
   - Uses `node-canvas` to rasterize the SVG string to a PNG buffer
   - Can also format the output as a Kitty terminal image

### File Organization

**Top-level modules:**
- `src/gum.ts` - Re-exports all elements and utilities; defines named constants (`none`, `blue`, `red`, etc.) and `KEYS`/`VALS` for the JSX evaluator
- `src/defaults.ts` - `DEFAULTS`, `THEME()` function, and theme management
- `src/eval.ts` - Code evaluation and element validation
- `src/render.ts` - SVG rendering to PNG via node-canvas
- `src/math.ts` - Standalone LaTeX → SVG rendering (`mathToElement`, `mathToSvg`); PNG/kitty output lives in `src/render.ts` (`mathToPng`, `mathToKitty`)
- `src/mark.ts` - Markdown → terminal rendering with embedded gum/math (`displayMarkdown`)

**Element modules (`src/elems/`):**
- `core.ts` - `Context`, `Element`, `Group`, `Svg`, `Rect`, plus `prefix_split`, `spec_split`, `align_frac`, `is_element`
- `layout.ts` - `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`, `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`
- `geometry.ts` - `Line`, `UnitLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`, `Polygon`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`
- `text.ts` - `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`, `Latex`, `Equation`
- `plot.ts` - `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`
- `network.ts` - `ArrowSpline`, `Node`, `Edge`, `Network`
- `symbolic.ts` - `SymPoints`, `SymLine`, `SymSpline`, `SymPoly`, `SymFill`, `SymField`
- `math.ts` - `MathSpan`, `MathText`, `MathArray`, `MathStretch`, `SupSub`, `Frac`, `Sqrt`, `Bracket`, `Latex`
- `image.ts` - `Image`
- `slide.ts` - `TitleBox`, `TitleFrame`, `Slide`

**Library modules (`src/lib/`):**
- `utils.ts` - Math utilities, array/vector ops, rect manipulation, color handling
- `text.ts` - Text measurement and wrapping using opentype.js
- `parse.ts` - JSX parser (Acorn) and AST walker
- `strict.ts` - Strict mode: turns silent rendering fallbacks into thrown errors
- `meta.ts` - Documentation metadata loading
- `term.ts` - Terminal utilities (stdin, Kitty protocol)
- `mark.ts` - Marked renderer and math extensions for terminal Markdown output

**Scripts:**
- `scripts/gum.ts` - The CLI for running the `gum` command
- `scripts/math.ts` - The `gum-tex` CLI for rendering LaTeX to SVG/PNG
- `scripts/mark.ts` - The `gum-down` CLI for displaying Markdown in the terminal
- `scripts/dev.ts` - The development server for running the `gum` command
- `scripts/skill.ts` - Creates a ZIP file for the Claude skill
- `scripts/test.ts` - Runs all `docs/code/`, `gala/code/` and `test/code/` examples as a test suite, and with `--report` writes the render data in `test/data/`

**Documentation:**
- `docs/text/` - Text documentation
- `docs/code/` - Component examples (one per element type)
- `gala/text/` - Gallery text documentation
- `gala/code/` - Gallery code examples

## Important Patterns

### Component Creation

All components take a single `args` parameter (a dictionary) and store it:
```javascript
class MyComponent extends Element {
    constructor(args = {}) {
        const { myProp, ...attr } = args
        super({ tag: 'g', ...attr })
        this.args = args
        this.myProp = myProp
    }
}
```

### Attribute Splitting

Use `spec_split(attr)` to separate layout params from SVG attributes:
```javascript
const [ spec, attr ] = spec_split(args)
// spec: { rect, coord, aspect, aspect0, expand, align, upright, offset, rotate, rotate_adjust, rotate_invar }
// attr: { stroke, fill, opacity, ... }
```

Use `prefix_split(prefixes, attr)` to split prefixed attributes for passing to sub-components. This allows parent components to accept prefixed props that get forwarded to children:
```javascript
class Plot extends Group {
    constructor(args = {}) {
        const [ xaxis_attr, yaxis_attr, attr ] = prefix_split(['xaxis', 'yaxis'], args)
        const xaxis = new Axis({ ...xaxis_attr, direc: 'h' })
        const yaxis = new Axis({ ...yaxis_attr, direc: 'v' })
        super({ children: [ xaxis, yaxis ], ...attr })
    }
}
```

### Context Mapping

Transform child specs through the context system. The `ctx.map(spec)` method takes a child's spec and returns a new Context with a pixel rect (`prect`) that conforms to the child's aspect ratio and alignment:

```javascript
inner(ctx) {
    return this.children
        .map(c => c.svg(ctx.map(c.spec)))
        .join('\n')
}
```

When mapping, if the child specifies an `aspect` ratio, `ctx.map()` will compute a pixel rect that respects that aspect. The child will be aligned within the available space according to its `align` parameter (e.g., 'center', 'left', [0.5, 0.5]).

## Element Specification

Element specification keys:
- `rect`: A rectangle `[x1, y1, x2, y2]` in coordinate space
- `coord`: The coordinate system for children `[xmin, ymin, xmax, ymax]`
- `aspect`: Width/height ratio
- `aspect0`: Original aspect ratio (before rotation, internal use only)
- `expand`: Whether to expand (true) or shrink (false) when fitting aspect
- `align`: How to align content ('left'/'center'/'right' or 'top'/'middle'/'bottom', or numeric 0-1)
- `rotate`: Rotation in degrees
- `rotate_invar`: Rotation-invariant (apply rotation after layout, not before)
- `rotate_adjust`: Adjust rotation to fit aspect ratio

Convenience keys (these map into the above keys):
- `flex`: Override to set `aspect = null`
- `pos/size`: Center position and size of the child's rectangle
- `xsize/ysize`: Specifies one dimension of `size` and applies `expand`
- `xlim/ylim`: Specify the coordinate limits for a specific dimension
- `spin`: Specifies a `rotate` value and applies `rotate_invar`
- `orient`: Specifies a `rotate` value and applies `rotate_adjust`
- `upright`: Whether to keep the child upright (true) or allow it to rotate (false)
- `offset`: Whether to offset the child by the parent's rect (true) or not (false)

## Math Elements

We use `katex` to parse LaTeX strings into an AST. This is then converted into gum.jsx elements and rendered to SVG. The `Latex` element is a wrapper that parses the LaTeX string and positions the element at the center of the rectangle.

`MathArray` implements katex's `array` node, which backs every tabular environment:
`matrix`/`pmatrix`/`bmatrix`/`vmatrix`/`Vmatrix`/`Bmatrix` (and their starred variants),
`smallmatrix`, `array`, `darray`, `cases`/`dcases`/`rcases`/`drcases`, `aligned`, `gathered`,
and `\substack` — plus `\\` row breaks, `\hline`/`\hdashline`, and `|`/`:` column
separators. It follows LaTeX's own metrics (`\arraystretch`, `\arraycolsep`, `\jot`, and
the per-row strut), so its height and depth match katex's to within a hundredth of an em.
From JSX it takes a flat list of cells plus `ncol` and reshapes them, the way `Grid` does,
since the JSX evaluator flattens nested array children.

`MathStretch` draws the stretchy decorations — `\overbrace`/`\underbrace`, the stretchy
over-accents (`\overrightarrow` and friends), all of `accentUnder`, and the `\x...`
extensible arrows. No font carries stretchable versions of any of these, so gum draws
them from a shape table keyed by katex's own label, using katex's `katexImagesData`
heights and minimum widths. The arrows are gum's own `Arrow`/`ArrowHead`/`Line`/`Arc`,
stroked in em: `MathShape.inner` (the base of every drawn shape) rebases the context's stroke
unit to its box's pixels per em (`ctx.clone({ unit })`), so `stroke_width: TEX.rule` is a TeX
rule at any font size and script-size arrows get proportionally thinner strokes. Heads are `ArrowHead`'s
open two-barb form with `arc: 92` (head depth/half-height = cot(arc/2) = 0.97, as measured on
Computer Modern's →) and `curve: 0.7` — `ArrowHead`'s barbs are circular arcs that leave the tip
turned toward the shaft by `curve * arc/2` and flare out (`curve = 1` is tangent to the shaft,
0 is straight; Computer Modern is about 0.7) — and `ArrowHead` takes `barb: 'left' | 'right'`
for harpoons. Note `Arrow`'s own `curve` bends the *shaft* (spline), while `arrow_curve` reaches
the heads via the `arrow_` prefix. Under-decorations get `STRETCH_UNDER_KERN` (0.1 em) of
clearance below the body; katex uses 0, which lets barb tips touch serif feet. Delimiters
(`fit_delim`, and the radical in `fit_radical`, both on `fit_glyph` over `SIZE_FONTS`) follow
TeX's rule: the first of Main, Size1…4 whose natural extent covers the requirement is used
unscaled, so they overshoot like TeX rather than being stretched (which would thicken the
glyph); only beyond Size4 is the glyph scaled, standing in for TeX's
extensible pieces. `Bracket` also takes `height`, a fixed total delimiter height in em that
ignores the body (TeX Rule 15e): the genfrac branch passes `TEX.delim1`/`delim2` for `\binom`
and friends, whose parentheses do not fit their contents. Braces,
groups and the `\utilde` tilde are still filled outlines (a centerline offset along its
normals in both directions). Two traps: a `Polygon`/`Line` maps its points through its
*own* context, so point-based pieces need the em `coord` explicitly — but `ArrowHead` and
`Arc` draw in their own unit box and are placed by `pos`/`size`, so they must *not* get
it. `\widehat`/`\widetilde`/`\widecheck` are stretchy to katex but do have glyphs, so the
converter only takes the drawn path for labels present in the shape table. Every drawn math
shape extends `MathShape` and resolves its colour with `shape_ink`: an explicit `fill`, else
the `color` in force, else the theme's ink (`MathShape` in `THEME_DARK`), so they follow the
text in dark mode; `MathArray`'s rules use the same rule.

`\operatorname` sets its body upright as a single Op atom, passing the upright face down
directly since gum cannot express katex's `withFont("mathrm")` through `TEX_FONT_FAMILY`.

Font commands flow down as `font_family` in the converter's `attr`: `TEX_FONT_FAMILY` is katex's
`fontMap` (`\mathbf` → `KaTeX_Main-Bold`, `\mathcal` → `KaTeX_Caligraphic`, …) and
`text_font_family` composes the `\text*` family/weight/shape. `MathSymbol` only honours the
requested face where it has the glyph (`resolve_font_override`), falling back to the symbol's own
face as katex does, which is also how `\boldsymbol` gets Math-BoldItalic letters and Main-Bold
operators. `\color` flows the same way as `color`; every `MathShape` takes it as a `fill` alias
so drawn shapes follow it.

A math box may draw outside the box it is laid out by: `hrange` is the horizontal ink range when
it differs from `[0, advance]` (`\rlap`, the cancel strokes) and `vink` the vertical one when it
differs from `vrange` (`\smash`, `\cancel` on a single character). `metrics_rect` gives the ink
rect, `metrics_bounds` the layout bounds, and `place_items`/`layout_math_row` place children by the
former while stacking by the latter (`hull_overhang`). `MathOval` (the `\oiint` ring) and
`MathCancel` are `MathShape`s like `MathStretch`; `enclose_box` builds `\boxed`/`\fbox`/
`\colorbox` from a `MathBox` plus `array_rules`. `\tiny` … `\Huge` scale relative to the size
in force, carried as `size` in the `ConvertCtx` (`{ attr, style, size }`) that `convert_tree`
threads through the conversion.

The goal is not always perfectly replicating what LaTeX/KaTeX do. We want the implementation to be simple and easy to understand, and to be able to use the full power of gum.jsx to create complex layouts.
