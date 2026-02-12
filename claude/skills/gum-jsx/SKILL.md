---
name: gum-jsx
description: Create plots, diagrams, and other visualizations with the "gum.jsx" language.
---

# Introduction

The `gum.jsx` language allows for the elegant and concise creation of SVG visualizations. It has a React-like JSX syntax, but it does not actually use React internally. When interpreted, it produces pure SVG of a specified size. It is a library of `Element` derived components such as `Circle`, `Stack`, `Plot`, `Network`, and many more. Some of these map closely to standard SVG objects, while others are higher level abstractions and layout containers. You can add standard SVG attributes (like `fill`, `stroke`, `stroke-width`, `opacity`, etc.) to any `Element` component and they will be applied to the resulting SVG.

*Proportional values*: In most cases, values are passed in proportional floating point terms. So to place an object in the center of its parent, you would specify a position of `[0.5, 0.5]`. When dealing with inherently absolute concepts like `stroke-width`, standard SVG units are used, and numerical values assumed to be specified in pixels. Most `Element` objects fill the standard coordinate space `[0, 0, 1, 1]` by default. To reposition them, either pass the appropriate internal arguments (such as `pos` or `rad`) or use a layout component such as `Box` or `Stack` to arrange them.

*Aspect ratio*: Any `Element` object can have an aspect ratio `aspect`. If `aspect` is not defined, it will stretch to fit any box, while if `aspect` is defined it will be sized so as to fit within the specified rectangle while maintaining its aspect ratio. However, when `expand` is set to `true`, the element will be resized so as to instead cover the specified rectangle, while maintaining its aspect ratio.

*Subunit arguments*: For compound elements that inherit `Group`, some keyword arguments are passed down to the constituent parts. For instance, in [Plot](/docs/Plot), one can specify arguments intended for the `XAxis` unit by prefixing them with `xaxis-`. For example, setting the `stroke-width` for this subunit can be achieved with `xaxis-stroke-width`.

*Functional approach*: Avoid explicit for loops. There are `numpy`-like functions such as `range` and `linspace` for generating arrays, `zip` for combining arrays, and `palette` for interpolating colors. Additionally, you can use `map` to generate a list of elements (such as bars for a bar plot).

*Style tips*: There will be cases where a user prompt does not fully specify every detail. In these cases, use your best judgment and consider the following suggestions:
  - Text should be legible and not overlap. Usually a text element `yrad` of about `0.1` to `0.2` works well
  - Points and other small features should be visible but not overwhelming. Usually a size of about `0.03` is good for small features
  - The figure should have appropriate outer margins so that extended features like tick labels do not get cut off. Usually a margin of about `0.1` to `0.2` works well. The best way to create outer margins is to wrap the final output in a `Box` or `Frame` component
  - When the aspect ratio of the figure is not determined, a good default is to use `2` for things like plots and diagrams
  - The top-level `<svg>` element will have `fill="none"` and `stroke="black"` applied automatically, so you only need to specify these attributes when they differ from these defaults

# Examples

Below are some examples of user prompts and code output.

**Example 1: Basic Circle**

Prompt: Create a blue circle that is enclosed in a rounded box. It should mostly fill the box, but not completely.

Generated code:
```jsx
<Frame padding margin rounded>
  <Circle fill={blue} />
</Frame>
```

*Notes*: We used boolean defaults for `padding`, `margin`, and `rounded`. These will get mapped to `padding={0.1}`, `margin={0.1}`, and `rounded={0.1}` respectively. This adds a little bit of a Tailwind-like flavor and is used throughout the library. Adding a `margin` on the outside is usually good so things like borders don't get clipped.

**Example 2: Symbolic Plot**

Prompt: Create a simple plot of a sine wave titled "Sine Wave" with dashed grid lines.

Generated code:
```jsx
<Plot aspect={2} margin={0.2} ylim={[-1.5, 1.5]} title="Sine Wave" grid grid-stroke-dasharray={4}>
  <SymLine fy={sin} xlim={[0, 2*pi]} />
</Plot>
```

**Example 3: Custom Component**

Prompt: Create two rounded boxes side by side. Left one should be blue, right one should be red.

Generated code:
```jsx
const Squire = attr => <Square rounded {...attr} />
return <HStack spacing>
  <Squire fill={blue} />
  <Squire fill={red} />
</HStack>
```

Note: Because this is two squares (unit aspect ratio) stacked side by side, the `HStack` will have an aspect ratio of 2.

# Utilities

Here are the handy array functions provided by the library. All of these mimic the behavior of their counterparts in Python and `numpy`. This can be useful for generating `Element` objects from arrays:
```typescript
function zip(...arrs: any[]): any[]
function range(start: number, end: number, step: number): number[]
function linspace(start: number, end: number, num: number): number[]
function enumerate(x: any[]): any[]
function repeat(x: any, n: number): any[]
function lingrid(xlim: range, ylim: range, N: number): number[][]
```

Some of the most commonly used mathematical constants are pre-defined in the global scope:
```javascript
const e = Math.E // base of the natural logarithm
const pi = Math.PI // ratio of circumference to diameter
const phi = (1 + sqrt(5)) / 2 // golden ratio
const r2d = 180 / Math.PI // conversion from radians to degrees
const d2r = Math.PI / 180 // conversion from degrees to radians
```

Additionally, there is a default `gum.jsx` color palette that is pre-defined in the global scope, but you can also use any valid CSS color string:
```javascript
const none = 'none'
const white = '#ffffff'
const black = '#000000'
const blue = '#1e88e5'
const red = '#ff0d57'
const green = '#4caf50'
const yellow = '#ffb300'
const purple = '#9c27b0'
const gray = '#f0f0f0'
```

To interpolate colors between color values, you can use these functions:
```typescript
function interp(c1: string, c2: string, x: number): string
function palette(c1: string, c2: string, clim: range): number => string
```

# Documentation

Below is the full documentation for the core \`gum.jsx\` components: \`Element\`, \`Group\`, and \`Box\`. All of the other components are derived from these and many use them as sub-components. Understanding these three components will give you a good foundation for working with the library.

## Element

The base class for all `gum.jsx` objects. You will usually not be working with this object directly unless you are implementing your own custom elements. An **Element** has a few methods that can be overriden, each of which takes a **Context** object as an argument. The vast majority of implementations will override only `props` and `inner` (for non-unary elements).

The position and size of an element are specified in the internal coordinates (`coord`) of its parent, which defaults to the unit square. Rectangles are always specified in `[left, top, right, bottom]` format. You can also specify the placement by specifying `pos` and `rad` or various combinations of `xrad`/`yrad` and `xrect`/`yrect`. When not specified, `rect` defaults to the unit square.

Parameters:
- `tag` = `g` — the SVG tag associated with this element
- `unary` = `false` — whether there is inner text for this element
- `aspect` = `null` — the width to height ratio for this element
- `pos` — the desired position of the center of the child's rectangle
- `rad` ­— the desired radius of the child's rectangle (can be single number or pair)
- `xrad`/`yrad` ­— specify the radius for a specific dimension (and expand the other)
- `rect` — a fully specified rectangle to place the child in (this will override `pos`/`rad`)
- `xrect`/`yrect` ­— specify the rectangle for a specific dimension
- `aspect` — the aspect ratio of the child's rectangle
- `expand` — when `true`, instead of embedding the child within `rect`, it will make the child just large enough to fully contain `rect`
- `align` — how to align the child when it doesn't fit exactly within `rect`, options are `left`, `right`, `center`, or a fractional position (can set vertical and horizontal separately with a pair)
- `rotate` — how much to rotate the child by (degrees counterclockwise)
- `spin` — like rotate but will maintain the same size
- `vflip/hflip` — flip the child horizontally or vertically
- `flex` ­— override to set `aspect = null`
- `...` = `{}` — additional attributes that are included in `props`

Methods:
- `props(ctx)` — returns a dictionary of attributes for the SVG element. The default implementation returns the non-null `attr` passed to the constructor
- `inner(ctx)` — returns the inner text of the SVG element (for non-unary). Defaults to returing empty string
- `svg(ctx)` — returns the rendered SVG of the element as a `String`. Default implementation constructs SVG from `tag`, `unary`, `props`, and `inner`

**Example**

Prompt: create a custom triangle element called `Tri` and use it to create a triangle with a gray fill

Generated code:
```jsx
const Tri = ({ pos0, pos1, pos2, ...attr }) => <Shape {...attr}>{[pos0, pos1, pos2]}</Shape>
return <Tri pos0={[0.5, 0.1]} pos1={[0.9, 0.9]} pos2={[0.1, 0.9]} fill={gray} />
```

## Group

*Inherits*: **Element**

This is the main container class that all compound elements are derived from. It accepts a list of child elements and attempts to place them according to their declared properties. Child placement positions are specified in the group's internal coordinates (`coord`), which defaults to the unit square. The coordinate space is specified in `[left, top, right, bottom]` format.

The child's `aspect` is an important determinant of its placement. When it has a `null` aspect, it will fit exactly in the given `rect`. However, when it does have an aspect, it needs to be adjusted in the case that the given `rect` does not have the same aspect. The `expand` and `align` specification arguments govern how this adjustment is made.

Parameters:
- `children` = `[]` — a list of child elements
- `aspect` = `null` — the aspect ratio of the group's rectangle (can pass `'auto'` to infer from the children)
- `coord` = `[0, 0, 1, 1]` — the internal coordinate space to use for child elements (can pass `'auto'` to contain children's rects)
- `xlim`/`ylim` = `null` — specify the `coord` limits for a specific dimension
- `clip` = `false` — clip children to the group's rectangle if `true` (or a custom shape if specified)

**Example**

Prompt: a square in the top left and a circle in the bottom right

Generated code:
```jsx
<Group>
  <Rectangle pos={[0.3, 0.3]} rad={0.1} spin={15} />
  <Ellipse pos={[0.7, 0.7]} rad={0.1} />
</Group>
```

## Box

*Inherits*: **Group** > **Element**

This is a simple container class allowing you to add padding, margins, and a border to a single **Element**. It's pretty versatile and is often used to set up the outermost positioning of a figure. Mirroring the standard CSS definitions, padding is space inside the border and margin is space outside the border. This has no border by default, but there is a specialized subclass of this called **Frame** that defaults to `border = 1`.

**Box** can be pretty handly in various situations. It is differentiated from **Group** in that it will adopt the `aspect` of the child element. This is useful if you want to do something like shift an element up or down by a certain amount while maintaining its aspect ratio. Simply wrap it in a **Box** and set child's `pos` to the desired offset.

There are multiple ways to specify padding and margins. If given as a scalar, it is constant across all sides. If two values are given, they correspond to the horizontal and vertical sides. If four values are given, they correspond to `[left, top, right, bottom]`.

The `adjust` flag controls whether padding/margins are adjusted for the aspect ratio. If `true`, horizontal and vertical components are scaled so that their ratio is equal to the `child` element's aspect ratio. This yields padding/margins of constant apparent size regardless of aspect ratio. If `false`, the inputs are used as-is.

Parameters:
- `padding` = `0` / `0.1` — the padding to be added (inside border)
- `margin` = `0` / `0.1` — the margin to be added (outside border)
- `border` = `0` / `1` — the border width to use (stroke in pixels)
- `rounded` = `0` / `0.1` — the border rounding to use (proportional to the box size)
- `adjust` = `true` — whether to adjust values for aspect ratio
- `shape` = `Rect` — the shape class to use for the border
- `clip` = `false` — whether to clip the contents to the border shape

Subunit names:
- `border` — keywords to pass to border, such as `stroke` or `stroke-dasharray`

**Example**

Prompt: the text "hello!" in a frame with a dashed border and rounded corners

Generated code:
```jsx
<Box padding border rounded border-stroke-dasharray={5}>
  <Text>hello!</Text>
</Box>
```

# References

Below is a list of topics to reference for documentation and usage examples for the various components. Every `gum.jsx` component is documented here. Your code must either use these components or create its own custom components. Before using a component, be sure to read the relevant reference to fully understand its parameters and capabilities.

## Layout

**File**: [layout](references/layout.md)

These are the raw layout components that assist you in arranging elements in a figure. They typically take a list of child elements and arrange them in a specified way. `Box` is a simple container element that can be used to add padding, border, and rounded corners to a group of elements.

`Stack` lets you arrange elements in a vertical or horizontal stack (like `flexbox` in CSS) in a way that respects the aspect ratio of the child elements. Typically you would use the specialized subclasses `VStack` and `HStack` for vertical and horizontal stacks, respectively. `Grid` does something similar but for a 2D grid of rows and columns (like `grid` in CSS).

`Points` is different in that it takes a list of locations and arranges a given element at each of those locations (with the default element being `Dot`, a solid filled `Circle`).

**Components**:
- *Box*: a box with a padding, border, and rounded corners
- *Stack*/*VStack*/*HStack*: arrange elements vertically or horizontally
- *Grid*: arrange elements in a grid of specified size
- *Points*: arrange one element at each of a list of locations

## Shapes

**File**: [shapes](references/shapes.md)

These are the basic geometric shapes that can be used to create more complex figures. Both `Rect` and `Ellipse` are aspectless by default but can be given an aspect ratio to control their shape (i.e., a circle is an `Ellipse` with an aspect of `1`).

`Line` is actually more general than just a single straight line. It can be used to draw piecewise linear paths by passing a list of points. For the case of simple unit lines, use `UnitLine` and its specialized variants `VLine` and `HLine` instead. For closed paths, either pass `closed` to `Line` or use `Shape` instead.

For multi-segment Bézier splines, `Spline` is the way to go. It takes a list of control points and draws a smooth cubic spline through them. You can control the tension of the spline with the `curve` parameter (default is `0.5`). This also accepts a `closed` parameter to draw a closed spline.

**Components**:
- *Rect*: a rectangle
- *Ellipse*: an ellipse
- *Line*/*Shape*: a piecewise linear path (possibly closed)
- *Spline*: a multi-segment Bézier spline (possibly closed)
- *UnitLine*/*VLine*/*HLine*: a single unit line

## Text

**File**: [text](references/text.md)

These are components that can be used to create text elements. `Text` is a fairly sophisticated component that handles text wrapping, line spacing, and other text-related features. You can specify the wrap width (in "ems", that is, in proportion to the line height) with the `wrap` parameter and the alignment with the `justify` parameter. Feel free to intersperse non-text elements with text elements to create more complex layouts.

`TextStack` is a simple component that stacks text elements vertically. Specifying a `wrap` width will cause every child element to be wrapped to the specified width. You can specify the vertical spacing between the elements with the `spacing` parameter. The `TitleFrame` is a `Frame` subclass that automatically adds a boxed title to the top of the frame. Finally, `Slide` is basically a `TextStack` wrapped in a `TitleFrame`.

`Latex` does what it sounds like: it renders a single LaTeX equation. This uses MathJax under the hood, so it supports most but not all inline LaTeX features.

**Components**:
- *Text*: a text element with wrapping
- *TextStack*: a stack of text elements
- *TitleFrame*: a frame with a title
- *Slide*: a slide with a title and content
- *Latex*: a single LaTeX equation

## Symbolic

**File**: [symbolic](references/symbolic.md)

These components allow you to plot functions symbolically. That is, they accept functions as arguments and plot them accordingly. Functions can be specified as [x => y], [y => x], or [t => (x,y)]. You can control the range over which the domain is sampled with the `tlim`/`xlim`/`ylim` parameters. You can also control the number of samples to take with the `N` parameter.

These clearly extend their non-`Sym` counterparts by adding the ability to plot functions symbolically. The only additional element is `SymFill`, which plots a filled area between two functions. For this one, passing a constant to either `fy1` or `fy2` is equivalent to passing a constant function.

**Components**:
- *SymPoints*: plot points functionally
- *SymLine*/*SymShape*: plot a curve functionally (possibly closed)
- *SymSpline*: plot a Bézier spline functionally (possibly closed)
- *SymFill*: plot a filled area between two functions

## Plotting

**File**: [plotting](references/plotting.md)

There are components for creating various types of plots. The core element is `Graph`, which is a container element that accepts a list of children to plot over a specified coordinate system (`xlim`/`ylim`/`coord`). `Plot` is a `Graph` subclass that adds axes (with `Axis`/`HAxis`/`VAxis`), labels, and other plot-specific features. `BarPlot` is a help element that wraps a `Bars` element inside of a `Plot`.

The `Plot` element in particular is highly customizable, and you can pass arguments to sub-components using `axis`/`label`/`title` prefixes. For instance, to specify the stroke width of the x-axis, you can use `xaxis-stroke-width`. This logic applies to other types of compound components as well.

**Components**:
- *Graph*: a graph containing multiple elements with a specified coordinate system
- *Plot*: a plot containing a graph, axes, and labels
- *Axis*/*HAxis*/*VAxis*: a single axis for a plot
- *Bars*/*BarPlot*: a bar plot (bare or wrapped in a `Plot`)

## Networks

**File**: [networks](references/networks.md)

These are components for creating network diagrams. The core element is `Network`, which is a container element that accepts a list of `Node`s and `Edge`s, as well as potentially other elements like labels. A `Node` can specify an `id` to be used to reference it from an `Edge` as either the source (`from`) or destination (`to`). Default values for `Node` and `Edge` arguments can be specified with `node-` and `edge-` prefixed arguments passed to the `Network` element.

The `Edge` element has a `dir1` and `dir2` parameter to specify the direction of the arrowhead for the source and destination nodes, respectively. You can also toggle arrowheads on either side with `arrow`/`from-arrow`/`to-arrow` or specify the `curve` parameter to control the curvature of the edge.

**Components**:
- *Node*: a node in a network
- *Edge*: an edge in a network
- *Network*: a network containing nodes and edges

## Utilities

**File**: [utilities](references/utilities.md)

These are the helper functions that are available in the library. They are not components themselves, but they are useful for creating and manipulating data. Many of them mimic the behavior of their counterparts in Python and `numpy` and are useful for generating `Element` objects from arrays. There are also some commonly used mathematical constants and tools for interpolating colors.

**Components**:
- *Math*: mathematical functions
- *Arrays*: array operations
- *Colors*: color operations
