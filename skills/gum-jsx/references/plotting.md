# Plotting Elements

## Graph

*Inherits*: **Group** > **Element**

This is the core graphing functionality used in **Plot** without the axes and labels. The default coordinate system is the unit square, `[0, 0, 1, 1]`. This can be overridden with custom `xlim`/`ylim` specifications. The Elements that are passed to **Graph** can express their position and size information in this new coordinate system.

Parameters:
- `xlim`/`ylim` = `[0, 1]` — the range over which to graph
- `padding` = `0` — limit padding to add when auto-detected from `elems`
- `coord` — the coordinate system to use for the graph (overrides `xlim`/`ylim`)

**Example**

Prompt: a series of closely spaced squares rotating clockwise along a sinusoidal path

Generated code:
```jsx
<Graph ylim={[-1.5, 1.5]} padding={0.2} aspect={2}>
  <SymPoints
    fy={sin} xlim={[0, 2*pi]} size={0.5} N={100}
    shape={x => <Square rounded spin={r2d*x} />}
  />
</Graph>
```

## Plot

*Inherits*: **Group** > **Element**

Use **Graph** to plot one or more elements over the desired limits and frame them with axes. If not specified by `xlim` and `ylim`, the limits of the plot will be computed from the bounding box of the constituent elements. By default, the `aspect` will be the ratio of the range of the `xlim` and `ylim`. See **Axis** for more details on how to customize the axes, ticks, and labels.

Parameters:
- `xlim`/`ylim` = `[0, 1]` — the range over which to graph
- `xanchor`/`yanchor` — the value at which to place the respective axis. Note that the `xanchor` is a y-value and vice versa. Defaults to `xmin`/`ymin`
- `xticks`/`yticks` = `5` — either an integer for evenly spaced ticks, a list of tick locations, or list of tick `**location, label]` pairs (see [Axis** for more details)
- `grid`/`xgrid`/`ygrid` = `false` — whether to show a grid in the background. If `true`, the grid lines match the specified ticks. Alternatively, you can pass a list of positions to override this
- `xlabel`/`ylabel` — a string or **Element** to use as the respective label
- `title` — a string or **Element** to use as the title
- `padding` = `0` ­— additional padding to add to auto-detected coordinate limits
- `margin` = `0` — margin to add around the plot (needed to include labels and title)
- `border` = `0` — border width to use
- `clip` = `false` — clip graph contents to specified coordinates

Subunits:
- `axis`/`xaxis`/`yaxis` — the axes, including lines, ticks, and tick labels
- `grid`/`xgrid`/`ygrid` — the grid lines arrayed under the graph
- `label`/`xlabel`/`ylabel` — the axis label elements
- `title` — the plot title element

**Example**

Prompt: plot an inverted sine wave with ticks labeled in multiples of π. There is a faint dashed grid. The x-axis is labeled "phase" and the y-axis is labeled "amplitude". The title is "Inverted Sine Wave".

Generated code:
```jsx
const xticks = linspace(0, 2, 6).slice(1).map(x => [x*pi, `${rounder(x, 1)} π`])
return <Plot aspect={phi} margin={0.25} xanchor={0} xticks={xticks} xlabel="phase" ylabel="amplitude" title="Inverted Sine Wave" xaxis-tick-side="both" grid grid-stroke-dasharray={3}>
  <SymLine fy={x => -sin(x)} xlim={[0, 2*pi]} />
</Plot>
```

## Axis

*Inherits*: **Group** > **Element**

A single vertical or horizontal axis for plotting. This includes the central line, the perpendicual ticks, and their associated tick labels. Note that the proper bounds encompass only the central line and ticks, while the tick labels may fall well outside of them. Use **HAxis** and **VAxis** for specific directions.

Because `Axis` is used primarily for **Plot**, the `tick-side` parameter is inverted for `VAxis`, meaning `outer` points up and `inner` points down. Meanwhile, for `HAxis`, `outer` points to the left and `inner` points to the right.

Parameters:
- `direc` — the orientation of the axis, either `v` (vertical) or `h` (horizontal)
- `ticks` — a list of tick `[location, label]` pairs. The label can either be an `Element` or a string
- `lim` = `[0, 1]` — the extent of the element along the main axis
- `tick-side` = `'both'` — one of `'inner'` / `'outer'` / `'both'` / `'none'` , or a pair representing a numerical range in `[0, 1]`, where zero is oriented in the inner direction
- `label-side` = same as `tick-side` but for the labels
- `children` = a list of `Element`s to use as the tick labels instead of `ticks`. These must have a `loc` to tell `Axis` where to place the label and associated tick.

Subunits:
- `line`: the central line along the main axis
- `tick`: the perpendicular tick marks (collectively)
- `label`: the labels annotating the tick marks (collectively)

**Example**

Prompt: a horizontal axis with 5 ticks labeled with emojis for: mount fuji, a rocket, a whale, a watermellon, and a donut

Generated code:
```jsx
const emoji = ['🗻', '🚀', '🐳', '🍉', '🍩']
const ticks = zip(linspace(0, 1, emoji.length), emoji)
return <Box padding={[0.5, 1]}>
  <HAxis aspect={10} ticks={ticks} tick-side="outer" label-size={1} />
</Box>
```

## BarPlot

*Inherits*: **Plot** > **Group** > **Element**

Makes a plot featuring a bar graph. This largely wraps the functionality of **Plot** but takes care of labelling and arranging the `xaxis` information. You can provide `label` and `size` attributes to the child elements. The **Bar**/**VBar**/**HBar** elements are just very thin wrappers around **Rect** elements, and you can use other elements in their place if you wish.

To layout just the bars without axes, use the **Bars** element directly, which this wraps using **Plot**. This way, you can plot other elements alongside the bars, such as labels or error bars. By default, the bars will be placed at `[0, ..., N-1]` along the x-axis.

Child parameters:
- `label` — the label for the bar
- `size` — the height of the bar

Parameters:
- `direc` = `v` — the orientation of the bars in the plot

Subunit names:
- `bar` — keywords to pass to the underlying **Bars** element

**Example**

Prompt: A plot with three bars with black borders at "A", "B", and "C". The first bar is red and is the shortest, the second bar is blue and is the tallest, while the third bar is green and its height is in between.

Generated code:
```jsx
<BarPlot ylim={[0, 10]} yticks={6} ygrid title="Example BarPlot" xlabel="Category" ylabel="Value" margin={0.25}>
  <Bar label="A" size={3} fill={red} />
  <Bar label="B" size={8.5} fill={blue} />
  <Bar label="C" size={6.5} fill={green} />
</BarPlot>
```
