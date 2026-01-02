---
name: gum-visuals
description: Create plots, diagrams, and other visualizations with the "gum" language.
---

# Introduction

The `gum` language allows for the elegant and concise creation of SVG visualizations. It has a React-like JSX syntax, but it does not actually use React internally. When interpreted, it produces pure SVG of a specified size. Your task is to generate the appropriate `gum` JSX code to satisfy the user's request. Rendering of the SVG will be done on the client side.

You will typically construct your figure with a combination of `Element` derived components such as `Circle`, `Stack`, `Plot`, `Network`, and many more. Some of these map closely to standard SVG objects, while others are higher level abstractions and layout containers. You can add standard SVG attributes (like `fill`, `stroke`, `stroke-width`, `opacity`, etc.) to any `Element` component and they will be applied to the resulting SVG.

*Proportional values*: In most cases, values are passed in proportional floating point terms. So to place an object in the center of its parent, you would specify a position of `[0.5, 0.5]`. When dealing with inherently absolute concepts like `stroke-width`, standard SVG units are used, and numerical values assumed to be specified in pixels. Most `Element` objects fill the standard coordinate space `[0, 0, 1, 1]` by default. To reposition them, either pass the appropriate internal arguments (such as `pos` or `rad`) or use a layout component such as `Box` or `Stack` to arrange them.

*Aspect ratio*: Any `Element` object can have an aspect ratio `aspect`. If `aspect` is not defined, it will stretch to fit any box, while if `aspect` is defined it will be sized so as to fit within the specified rectangle while maintaining its aspect ratio. However, when `expand` is set to `true`, the element will be resized so as to instead cover the specified rectangle, while maintaining its aspect ratio.

*Subunit arguments*: For compound elements that inherit `Group`, some keyword arguments are passed down to the constituent parts. For instance, in [Plot](/docs/Plot), one can specify arguments intended for the `XAxis` unit by prefixing them with `xaxis-`. For example, setting the `stroke-width` for this subunit can be achieved with `xaxis-stroke-width`.

# Examples

Below are some examples of user prompts and code output.

**Example 1: Basic Circle**

Prompt: Create a blue circle that is enclosed in box. It should mostly fill the box, but not completely.

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
<Frame margin={0.2}>
  <Plot aspect={2} ylim={[-1.5, 1.5]} title="Sine Wave" grid grid-stroke-dasharray={4}>
    <DataPath fy={sin} xlim={[0, 2*pi]} />
  </Plot>
</Frame>
```

**Example 3: Custom Component**

Prompt: Create two rounded boxes side by side in a frame. Left one should be blue, right one should be red.

Generated code:
```jsx
const Squire = attr => <Square rounded {...attr} />
return <Frame padding margin rounded>
  <HStack spacing>
    <Squire fill={blue} />
    <Squire fill={red} />
  </HStack>
</Frame>
```

*Notes*: The user didn't specify the aspect ratio, so we use `2` as a default. The `grid` attribute is a boolean, so we can omit the `true` part. To specify only one grid direction, we could instead use `xgrid` and `ygrid`. For sub-components like `grid` we can pass attributes using the `grid-` prefix. In general, `Plot` will auto-detect the y-axis limits, but I wanted to add a bit of padding to the top and bottom. We also need to be careful to add enough `margin` on the outside to avoid clipping the axis labels.

# Core Classes

{{{Element}}}

{{{Group}}}

{{{Box}}}

# Documentation

Below is a list of files to reference for documentation examples on the various components.

**Layout**:
- [Stack](references/Stack.md): arrange elements vertically or horizontally
- [Grid](references/Grid.md): arrange elements in a grid of specified size
- [Points](references/Points.md): arrange one element at each of a list of points

**Shapes**:
- [Rect](references/Rect.md): a rectangle
- [Ellipse](references/Ellipse.md): an ellipse
- [Line](references/Line.md): a single straight line
- [Polyline](references/Polyline.md): a multi-segment line

**Text**:
- [Text](references/Text.md): a single text element
- [Latex](references/Latex.md): a single LaTeX equation
- [TitleFrame](references/TitleFrame.md): a frame with a title
- [Slide](references/Slide.md): a slide with a title and content

**Symbolic**:
- [SymPoints](references/SymPoints.md): plot points symbolically (i.e., using a function)
- [SymLine](references/SymLine.md): plot a line symbolically
- [SymFill](references/SymFill.md): plot a filled area symbolically

**Plotting**:
- [Graph](references/Graph.md): a graph containing multiple elements with a specified coordinate system
- [Plot](references/Plot.md): a plot containing a graph, axes, and labels
- [Axis](references/Axis.md): a single axis for a plot
- [BarPlot](references/BarPlot.md): a bar plot

**Networks**:
- [Node](references/Node.md): a node in a network
- [Edge](references/Edge.md): an edge in a network
- [Network](references/Network.md): a network containing nodes and edges

**Functions**:
- [Math](references/Math.md): mathematical functions
- [Arrays](references/Arrays.md): array operations
- [Colors](references/Colors.md): color operations
