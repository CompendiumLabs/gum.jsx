# `gum.jsx` Framework

`gum.jsx` is a language for creating visualizations using a React-like JSX dialect that evaluates into SVG. It's designed for creating general graphics, plots, graphs, and network diagrams. The language supports declarative component-based rendering with automatic layout and coordinate system mapping.

## Commands

### Running the CLI

The `gum` command (and `gum-tex`, `gum-down`) is shipped by the batteries-included `gum-jsx`
package (`../gum-jsx`); install it globally or run `bun scripts/gum.ts` there. To test the output
of a `gum.jsx` snippet or file, pipe it to `gum`. If you have vision capabilities, this can be
useful for seeing the actual output of the code, either in SVG or PNG format.

```bash
# Generate SVG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum -f svg

# Generate PNG from a gum.jsx snippet and save to file
echo '<Rectangle rounded fill={blue} />' | gum -o test.png

# Generate SVG/PNG from a .jsx file
gum ../gum-jsx-docs/docs/code/Box.jsx -o test.svg

# Run options:
# file: gum.jsx file to render (reads from stdin if not provided)
# -s, --size <size>        size of the svg/viewBox (default: 1000)
# -u, --unit-size <size>   image size at which stroke_width = 1 is one pixel (default: 1000)
# -r, --raster-size <size> max rasterized PNG size (default: null)
# -f, --format <format>    format: svg, png, kitty (default: kitty or inferred)
# -t, --theme <theme>      theme to use (default: light)
# -b, --background <color> background color (default: white)
# -o, --output <output>    output file (default: null)
# --strict                 throw on rendering fallbacks instead of drawing them
# --seed <seed>            seed for random/uniform/normal/integer (default: 42)
```

### Packages

This repo is `@gum-jsx/core`: the JSX → SVG evaluator, the core elements, and the fonts — a
pure, platform-neutral library with no CLI. Everything under
`@gum-jsx/*` is a library; the batteries-included `gum-jsx` package (`../gum-jsx`) depends on
all of them and ships the CLIs and the test suite. The siblings, each linked locally with
`bun link` while unpublished (see their `CLAUDE.md`s):

- `@gum-jsx/math` (`../gum-jsx-math`): the LaTeX elements (`Latex`, `Tex`, `MathArray`, …), the
  KaTeX faces, `mathToSvg`/`mathToPng`.
- `@gum-jsx/node` (`../gum-jsx-node`): the node runtime — `rasterizeSvg`/`rasterizePixels` via
  node-canvas, kitty `formatImage`, `ansi`, `readStdin`. Core has no `canvas` dependency.
- `@gum-jsx/mark` (`../gum-jsx-mark`): Markdown → terminal rendering (`displayMarkdown`).
- `@gum-jsx/docs` (`../gum-jsx-docs`): the documentation and gallery examples (`docs/`, `gala/`),
  the loaders that index them, and the Claude skill built from them (`skills/gum-jsx`, by its
  `scripts/skill.ts`) — content only, with no dependency on core.
- `gum-jsx` (`../gum-jsx`): re-exports all of the above (`gum-jsx`, `gum-jsx/eval`, `gum-jsx/math`,
  `gum-jsx/render`, `gum-jsx/mark`, `gum-jsx/meta`), the `gum`/`gum-tex`/`gum-down` bins, the
  strict-mode test runner (`gum-jsx/test`), the feature tests in `test/code`, and the report
  app.

An add-on registers its elements and fonts through the registries below, and reaches core
internals through the subpath exports `@gum-jsx/core/lib/*`, `@gum-jsx/core/elems/*`,
`@gum-jsx/core/fonts`, `@gum-jsx/core/eval` and `./package.json` — that is the surface core
commits to.

### Testing

Run type checking:

```bash
bun tsc --noEmit
```

The example suite lives in `gum-jsx` (`../gum-jsx`): `bun scripts/test.ts` there renders every
example in `@gum-jsx/docs` (`../gum-jsx-docs`: `docs/code/`, `gala/code/`) plus its own
`test/code/` in **strict mode**
(`src/lib/strict.ts`), which turns the permissive rendering fallbacks into thrown `StrictError`s
so silent breakage shows up as a failure: unparseable TeX (`parse`), a katex node with no gum
equivalent (`node`), an unknown command name drawn verbatim (`symbol`), a TeX font command with
no gum face mapped (`font`), and a character missing from the resolved face (`glyph`). Strict
mode is **off by default** everywhere else; it is a `strict` flag on `evaluateGum` and `--strict`
on the CLIs. An example that deliberately exercises a fallback opts out with a `@nostrict`
comment. `bun scripts/test.ts --report` there also writes every render to `test/data` for the
`test/report` browser (`bun run report`).

Or test a single file:
```bash
gum ../gum-jsx-docs/docs/code/Box.jsx -o test.svg
```

## Architecture

### Registries

Two registries let core and add-ons (today the math elements; later separate packages) declare
what they provide with separate calls, instead of one static table:

- **Elements and context** (`src/lib/registry.ts`): `registerContext(values)` binds constants and
  utilities as globals of evaluated JSX and `registerElements(elems)` binds element constructors
  by tag name (also recorded in `ELEMS`). `src/lib/parse.ts` reads the live `CONTEXT` at
  evaluation time. `src/gum.ts` registers the core names (`CORE_ELEMS`) and `@gum-jsx/math`
  registers `MATH_ELEMS` when imported; `src/eval.ts` imports `./gum` so evaluating always has
  core available.
- **Fonts** (`src/fonts/fonts.ts`): `registerFonts(paths, faces?)` makes families known by name
  without loading them — `FONT_PATHS` maps a name to a file (or a light/regular/bold set) and
  `FONT_FACES` gives the css face for names that are not their own family. `fonts.ts` registers
  the text fonts (IBM Plex Sans/Mono; `TEXT_FONTS`) and `@gum-jsx/math` registers
  the 18 KaTeX faces from the `katex` package (`MATH_FONTS`) when imported.
  `registerFont(name, path, face?)` registers one family and loads it.
  `loadFonts()` and `fontsLoaded()` default to everything registered (`registeredFonts()`).

### Fonts

Text layout measures real glyph metrics with opentype.js, so the fonts must be loaded before elements are constructed. Loading is per family and memoized:

- **node**: nothing to do — registered fonts are read from disk on first use (`getFont`), so a render only parses the faces it touches.
- **browser**: fonts are fetched, so hosts must `await loadFonts()` (everything registered), `loadTextFonts()`, `loadFonts([...names])`, or `@gum-jsx/math`'s `loadMathFonts()` (all 18 KaTeX faces, ~480 kB) / `loadBaseMathFonts()` (the 7 ordinary math needs, ~190 kB) before evaluating. A missing font throws `FontNotLoadedError` (exported from `@gum-jsx/core` and `@gum-jsx/core/fonts`; `.font` is the family) from `textFont`, so a host can `loadFonts([e.font])` and retry — `@gum-jsx/math`'s `mathToSvgAsync` does exactly that.

The SVG output references fonts by family name (plus `font-weight`/`font-style` for the bold and italic KaTeX faces); a browser host also needs `@font-face` rules (the URLs are in `FONT_PATHS`) for the glyphs to actually draw. A face that is not its own family (the bold and italic KaTeX faces, registered one name per file for measurement) is emitted by `Span` as the base family plus weight/style via `fontFace()`, which is how fontconfig (used by the rasterizer) and browsers know it. `@gum-jsx/node` hands the registry to node-canvas lazily at the first rasterization, so fonts registered after it is imported are still found.

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
- `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`

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
  staying a fixed pixel width. The reference size is the `unit_size` prop of `Svg` (default
  `D.unit_size`; `--unit-size` on the CLI): it is the size the image was designed at, so a
  32px icon sets `unit_size={32}` to get pixel strokes and still scales them when rendered
  larger. `Element.props()` resolves `stroke_width`, `stroke_dasharray` and
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
   - Injects the registered `CONTEXT` (`src/lib/registry.ts`) as globals: components, constants, and utilities

2. **Evaluate** (`src/eval.ts`): AST → Element tree
   - Runs the transformed code to instantiate components
   - Wraps result in `Svg` component if needed
   - Validates that result is an Element

3. **Render** (`src/elems/*.ts`): Element tree → SVG string
   - Each Element's `svg(ctx)` method renders itself
   - Context propagates coordinate transformations down the tree
   - Groups recursively render their children

4. **Rasterize** (`@gum-jsx/node`): SVG string → PNG buffer
   - Uses `node-canvas` to rasterize the SVG string to a PNG buffer
   - Can also format the output as a Kitty terminal image

### File Organization

**Top-level modules:**
- `src/gum.ts` - Re-exports all elements and utilities; defines named constants (`none`, `blue`, `red`, etc.) and registers the core names for the JSX evaluator
- `src/defaults.ts` - `DEFAULTS`, `THEME()` function, and theme management
- `src/eval.ts` - Code evaluation and element validation

**Element modules (`src/elems/`):**
- `core.ts` - `Context`, `Element`, `Group`, `Svg`, `Rect`, plus `prefix_split`, `spec_split`, `align_frac`, `is_element`
- `layout.ts` - `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`, `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`
- `geometry.ts` - `Line`, `UnitLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`, `Polygon`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`
- `text.ts` - `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`
- `plot.ts` - `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`
- `network.ts` - `ArrowSpline`, `Node`, `Edge`, `Network`
- `symbolic.ts` - `SymPoints`, `SymLine`, `SymSpline`, `SymPoly`, `SymFill`, `SymField`
- `image.ts` - `Image`
- `slide.ts` - `TitleBox`, `TitleFrame`, `Slide`

**Library modules (`src/lib/`):**
- `utils.ts` - Math utilities, array/vector ops, rect manipulation, color handling
- `text.ts` - Text measurement and wrapping using opentype.js
- `parse.ts` - JSX parser (Acorn) and AST walker
- `registry.ts` - Element and context registries for the JSX evaluator
- `strict.ts` - Strict mode: turns silent rendering fallbacks into thrown errors

**Scripts:**

**Documentation:**

The docs and gallery live in `@gum-jsx/docs` (`../gum-jsx-docs`): `docs/text/` and `docs/code/`
(one page and one example per element), `gala/text/` and `gala/code/` (the gallery). Add or edit
a page there, not here.

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
- `upright`: Whether to order the child's pixel rect (true) so a flipped parent coord (a `Graph`) places it but does not flip its insides; defaults to true for compound elements (`Box`, `Stack`, `Grid`, the text and math elements, `Arc`, `RoundedRect`) and false for point geometry, which should see the flip
- `offset`: Whether to offset the child by the parent's rect (true) or not (false)

## Math Elements

The LaTeX elements (`Latex`, `Tex`, `MathArray`, `MathStretch`, …) are in `@gum-jsx/math`; see
that package's `CLAUDE.md` for how the katex parse tree is converted. What core provides for
them: `Span` measurement (`rawTextMetrics`, `textHasGlyphs` in `src/lib/text.ts`), the stroke
unit on `Context` (a math shape rebases it to its box's pixels per em), the `Latex`/`MathShape`
theme entries in `src/lib/theme.ts`, and the strict-mode kinds in `src/lib/strict.ts`.
