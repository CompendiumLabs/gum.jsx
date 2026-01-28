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
