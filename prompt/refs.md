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
