# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

`gum` is a language for creating visualizations using a React-like JSX dialect that evaluates into SVG. It's designed for creating general graphics, plots, graphs, and network diagrams. The language supports declarative component-based rendering with automatic layout and coordinate system mapping.

## Commands

### Running the CLI

```bash
# Generate SVG from a .jsx file
cat test.jsx | bun run cli -f svg > output.svg

# Generate PNG from a .jsx file
cat test.jsx | bun run cli -f png > output.png

# CLI options:
# -s, --size <size>        size of the svg (default: 500)
# -w, --width <width>      width of the png (default: null)
# -h, --height <height>    height of the png (default: null)
# -f, --format <format>    format: svg or png (default: svg)
# -t, --theme <theme>      theme to use (default: dark)
# -b, --background <color> background color (default: null)
# -o, --output <output>    output file (default: null)
# -r, --raw                raw output (default: false)
```

### Testing

Test examples are in `docs/code/` and `docs/gala/`. Run the full test suite:
```bash
bun scripts/test.js
```

Or test a single file:
```bash
cat docs/code/box.jsx | bun run cli -f svg > output.svg
```

## Architecture

### Component System

The library is built around a class hierarchy split across element modules:

**Element** (`src/elems/core.js`) - Base class for all components
- Stores `args` (constructor arguments) as a dictionary for easy cloning
- Has a `spec` object containing layout parameters (rect, aspect, expand, align, rotate, invar, coord)
- Has an `attr` object containing SVG attributes (stroke, fill, etc.)
- Renders to SVG via the `svg(ctx)` method that takes a Context object

**Group extends Element** (`src/elems/core.js`) - Container base class
- Has a `children` array of Elements
- Supports automatic aspect ratio detection (`aspect: 'auto'`)
- Supports automatic coordinate system detection (`coord: 'auto'`)
- Handles clipping and masking

**Layout containers** (`src/elems/layout.js`):
- `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`
- `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`

**Geometry elements** (`src/elems/geometry.js`):
- `Line`, `UnitLine`, `VLine`, `HLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`
- `Shape`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`

**Text elements** (`src/elems/text.js`):
- `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`, `Latex`, `Equation`

**Plot elements** (`src/elems/plot.js`):
- `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`

**Network elements** (`src/elems/network.js`):
- `ArrowSpline`, `Node`, `Edge`, `Network`

**Symbolic elements** (`src/elems/symbolic.js`):
- `SymPoints`, `SymLine`, `SymSpline`, `SymShape`, `SymFill`, `SymField`

**Slide elements** (`src/elems/slide.js`):
- `TitleBox`, `TitleFrame`, `Slide`

### Context System

The `Context` class handles coordinate system mapping:
- Maps from logical coordinates (`coord`) to pixel coordinates (`prect`)
- Handles rotations, aspect ratios, alignments, and expansions
- Pre-computes scalers for performance
- Core method: `map(spec)` transforms child specs into new contexts

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

1. **Parse** (`src/lib/parse.js`): JSX code → AST using Acorn parser
   - Walks the AST and converts JSX elements to `new ComponentName({ ...props })`
   - Handles JSX expressions, spreads, and nested children
   - Imports `KEYS`/`VALS` from `src/gum.js` to inject all components and utilities as globals

2. **Evaluate** (`src/eval.js`): AST → Element tree
   - Runs the transformed code to instantiate components
   - Wraps result in `Svg` component if needed
   - Validates that result is an Element

3. **Render** (element classes): Element tree → SVG string
   - Each Element's `svg(ctx)` method renders itself
   - Context propagates coordinate transformations down the tree
   - Groups recursively render their children

### File Organization

**Top-level modules:**
- `src/gum.js` - Re-exports all elements and utilities; defines named constants (`none`, `blue`, `red`, etc.) and `KEYS`/`VALS` for the JSX evaluator
- `src/defaults.js` - `CONSTANTS`, `DEFAULTS`, `DEBUG`, `THEME()` function, and theme management
- `src/eval.js` - Code evaluation and element validation
- `src/render.js` - SVG rendering to PNG via Resvg
- `src/fonts.js` - Font data for text measurement

**Element modules (`src/elems/`):**
- `core.js` - `Context`, `Element`, `Group`, `Svg`, `Rect`, plus `prefix_split`, `spec_split`, `align_frac`, `is_element`
- `layout.js` - `Box`, `Frame`, `Stack`, `VStack`, `HStack`, `HWrap`, `Grid`, `Points`, `Anchor`, `Attach`, `Absolute`, `Field`, `Spacer`
- `geometry.js` - `Line`, `UnitLine`, `Square`, `Ellipse`, `Circle`, `Dot`, `Ray`, `Shape`, `Triangle`, `Path`, `Spline`, `Arc`, `RoundedRect`, `ArrowHead`, `Arrow`
- `text.js` - `Span`, `Text`, `TextStack`, `TextBox`, `TextFrame`, `TextFlex`, `Bold`, `Italic`, `Latex`, `Equation`
- `plot.js` - `Bar`, `Bars`, `Scale`, `Labels`, `Axis`, `Mesh`, `Graph`, `Plot`, `BarPlot`, `Legend`
- `network.js` - `ArrowSpline`, `Node`, `Edge`, `Network`
- `symbolic.js` - `SymPoints`, `SymLine`, `SymSpline`, `SymShape`, `SymFill`, `SymField`
- `slide.js` - `TitleBox`, `TitleFrame`, `Slide`

**Library modules (`src/lib/`):**
- `utils.js` - Math utilities, array/vector ops, rect manipulation, color handling
- `text.js` - Text measurement and wrapping using opentype.js
- `math.js` - LaTeX rendering via MathJax
- `parse.js` - JSX parser (Acorn) and AST walker
- `meta.js` - Documentation metadata loading
- `term.js` - Terminal utilities (stdin, Kitty protocol)

**Other:**
- `scripts/test.js` - Runs all `docs/code/` and `docs/gala/` examples as a test suite
- `docs/code/` - Component examples (one per element type)
- `docs/text/` - Text documentation
- `docs/gala/` - Gallery examples

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
// spec: { rect, aspect, expand, align, rotate, invar, coord }
// attr: { stroke, fill, opacity, ... }
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

### Prefix Splitting for Sub-Components

Use `prefix_split(prefixes, attr)` to split prefixed attributes for passing to sub-components. This allows parent components to accept prefixed props that get forwarded to children:
```javascript
class Plot extends Group {
    constructor(args = {}) {
        const [ xaxis_attr, yaxis_attr, attr ] = prefix_split(['xaxis', 'yaxis'], args)
        // xaxis_stroke becomes stroke in xaxis_attr
        // yaxis_size becomes size in yaxis_attr
        // non-prefixed props remain in attr

        const xaxis = new Axis({ ...xaxis_attr, direc: 'h' })
        const yaxis = new Axis({ ...yaxis_attr, direc: 'v' })
        super({ children: [xaxis, yaxis], ...attr })
    }
}
// Usage: <Plot xaxis_stroke="red" yaxis_size={2} fill="blue" />
```

### Reserved Keys

Layout/spec keys: `rect`, `aspect`, `expand`, `align`, `rotate`, `invar`, `coord`
Convenience keys: `pos`, `rad`, `xlim`, `ylim`, `flex`, `spin`, `hflip`, `vflip`, `xrad`, `yrad`

## Key Terminology

- **rect**: A rectangle `[x1, y1, x2, y2]` in coordinate space
- **prect**: A rectangle in pixel space (post-mapping)
- **coord**: The coordinate system for children `[xmin, ymin, xmax, ymax]`
- **aspect**: Width/height ratio
- **expand**: Whether to expand (true) or shrink (false) when fitting aspect
- **align**: How to align content ('left'/'center'/'right' or 'top'/'middle'/'bottom', or numeric 0-1)
- **rotate**: Rotation in degrees
- **invar**: Rotation-invariant (apply rotation after layout, not before)
