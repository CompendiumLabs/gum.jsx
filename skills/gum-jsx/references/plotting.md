# Plotting Elements

## Graph

*Inherits*: **Group** > **Element**

This is the core graphing functionality used in **Plot** without the axes and labels. By default, the coordinate system is automatically inferred from the limits of child elements. This can be overridden with custom `xlim`/`ylim`/`coord` specifications. The Elements that are passed to **Graph** can express their position and size information in this new coordinate system.

Unlike **Group**, **Graph** will automatically pass the given `coord` to all children, so they can express their position and size information in this new coordinate system. This is very useful for elements like **Line** or **Points**, which evaluate their `points` values based on their own coordinate system, not that of the container.

You'll often want to use **Graph** (directly or indirectly) to display mathematical curves, as they might otherwise come out looking upside down relative to what you expect (as higher y-values mean "down" in raw SVG).

Parameters:
- `xlim`/`ylim`/`coord` = `'auto'` — the coordinate system to use for the graph
- `padding` = `0` — proportional padding to add when limits are auto-detected from children

**Example**

Prompt: a series of closely spaced squares rotating clockwise along a sinusoidal path

Generated code:
```jsx
<Graph ylim={[-1.5, 1.5]} padding={0.2} aspect={2}>
  <SymPoints
    fy={sin} xlim={[0, 2*pi]} point-size={1} N={100}
    point-shape={x => <Square rounded spin={r2d*x} />}
  />
</Graph>
```

## Plot

*Inherits*: **Group** > **Element**

Uses **Graph** to plot one or more elements over the desired limits and frame them with axes. If not specified by `xlim` and `ylim`, the limits of the plot will be computed from the bounding box of the constituent elements. By default, the `aspect` will be the ratio of the range of the `xlim` and `ylim`. See **Axis** for more details on how to customize the axes, ticks, and labels.

By default, the extent of **Plot** only includes the graphing area itself, not the axes, labels, or title. To include these, you can set the `margin` parameter to a non-zero value. However, it many cases it makes more sense to enclose **Plot** in a **Frame**  or **Box** element and set the `margin` parameter on that instead. This is useful if you want to add border that exactly encloses the graphing area.

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
- `axis`/`xaxis`/`yaxis` — the axes, including lines, ticks, tick labels, and arrowheads (for instance, `axis-arrow-right` and `axis-arrow-top` add arrowheads to the ends of the axes)
- `grid`/`xgrid`/`ygrid` — the grid lines arrayed under the graph
- `label`/`xlabel`/`ylabel` — the axis label elements
- `title` — the plot title element

Title:
- `title-size` = `0.075` — the size of the title element
- `title-offset` = `0.05` — the offset of the title element from the top of the plot

Labels:
- `label-size` = `0.05` — the size of the label elements
- `label-offset` = `0.125` — the offset of the label elements from the axis
- `xlabel-size`/`ylabel-size` — the size of the x/y label element (overrides `label-size`)
- `xlabel-offset`/`ylabel-offset` — the offset of the x/y label element from the axis (overrides `label-offset`)

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

A single vertical or horizontal axis for plotting. This includes the central line, the perpendicular ticks, and their associated tick labels. Note that the proper bounds encompass only the central line and ticks, while the tick labels may fall well outside of them. Use **HAxis** and **VAxis** for specific directions.

Because `Axis` is used primarily for **Plot**, the `tick-side` parameter is inverted for `VAxis`, meaning `outer` points up and `inner` points down. Meanwhile, for `HAxis`, `outer` points to the left and `inner` points to the right.

Parameters:
- `direc` — the orientation of the axis, either `v` (vertical) or `h` (horizontal)
- `ticks` — either an integer for evenly spaced ticks, a list of tick locations, or a list of tick `[location, label]` pairs
- `lim` = `[0, 1]` — the extent of the element along the main axis
- `tick-side` = `'inner'` — one of `'inner'` / `'outer'` / `'both'` / `'none'`, or a pair representing a numerical range in `[0, 1]`, where zero is oriented in the inner direction
- `label-side` = `'outer'` — same as `tick-side` but for the labels
- `label-size` = `1.5` — the cross-axis extent allocated for labels
- `label-offset` = `0.75` — the gap between the ticks and the labels
- `label-justify` — horizontal justification for labels (defaults to `'right'` for `VAxis` outer labels)
- `arrow-left`/`arrow-right` = `false` — whether to add an arrowhead at the low/high end of an `HAxis`
- `arrow-bottom`/`arrow-top` = `false` — whether to add an arrowhead at the low/high end of a `VAxis` (in the inverted `Plot` sense, where `top` is the high end)
- `arrow-size` = `2` — the size of the arrowheads relative to the cross-axis extent
- `prec` — the number of significant digits for auto-generated tick labels
- `children` — a list of elements to use instead of those generated by `ticks`. Each label must have a `loc` to place it and its associated tick. Labels can optionally carry a `tick` element and `tick-size` to customize their tick marks (see below).

Child parameters:
- `loc` — the position along the axis at which to place the tick and label
- `tick` — an optional custom **Element** to use as the tick mark instead of the default line
- `tick-size` = `1` — a fraction controlling the length of the tick mark relative to the full tick extent, respecting `tick-side`

Subunits:
- `line`: the central line along the main axis
- `tick`: the perpendicular tick marks
- `label`: the labels annotating the tick marks
- `arrow`: the arrowheads at the axis ends (all of them)
- `arrow-left`/`arrow-right`/`arrow-top`/`arrow-bottom`: the individual arrowheads (overrides `arrow`)

**Example**

Prompt: a horizontal axis with 5 ticks labeled with emojis for: mount fuji, a rocket, a whale, a watermelon, and a donut

Generated code:
```jsx
const emoji = ['🗻', '🚀', '🐳', '🍉', '🍩']
const ticks = zip(linspace(0, 1, emoji.length), emoji)
return <Box padding={[0.5, 1]}>
  <HAxis aspect={10} ticks={ticks} tick-side="outer" label-size={1} label-offset={0.25} />
</Box>
```

## Scale

*Inherits*: **Group** > **Element**

Draws a row of tick marks: short lines perpendicular to the scale's direction, placed at `locs` along it. It is the building block for the ticks of an **Axis** and the lines of a **Mesh**. Use **HScale** for ticks spaced along the horizontal axis (which are vertical lines) and **VScale** for ticks spaced along the vertical axis (horizontal lines).

Each tick spans the cross direction over `span`, so a scale that fills its box with `span = **0, 1]` draws full-height ticks, and a `span` of `[0.4, 0.6]` draws short ones through the middle. Tick locations are in the element's coordinate space, so a scale inside a [Graph** can be given data coordinates directly.

Parameters:
- `locs` = `0` — either an integer for evenly spaced ticks over `span`, or a list of tick locations along the scale's direction
- `direc` = `h` — the direction the ticks are spaced along, `h` or `v`; the ticks themselves run the other way
- `span` = `[0, 1]` — the extent of each tick across the scale's direction
- `children` — a list of elements to use as the ticks instead of the generated lines. Each must carry a `tick-loc` and may carry a `tick-span`, and is stretched to that rect
- any other attributes are forwarded to the tick lines

**Example**

Prompt: a horizontal scale with five full-height ticks, and a vertical one with

Generated code:
```jsx
// short blue ticks at chosen locations
<HStack spacing={0.1}>
  <Frame aspect={2} margin={0.1}>
    <HScale locs={5} />
  </Frame>
  <Frame aspect={2} margin={0.1}>
    <VScale locs={[0.15, 0.35, 0.5, 0.8]} span={[0.4, 0.6]} stroke={blue} stroke-width={2} />
  </Frame>
</HStack>
```

## Labels

*Inherits*: **Group** > **Element**

Places a set of **Label** elements along one direction, each at its own `loc`, which is how an **Axis** lays out its tick labels. Use **HLabels** for labels spaced along the horizontal axis and **VLabels** for the vertical one. Every child must be a `Label` (or another element with an aspect and a `loc`); each is given a square box at its location, with the group's cross-direction extent on a side, so the labels are sized by the width of a `VLabels` strip or the height of an `HLabels` one. A `justify` on the group is forwarded to every label, which is how an axis right-aligns the labels beside a vertical axis.

A **Label** wraps a single string or element in a square **Anchor** so it can be positioned by its edge. It can be spun with `spin`, and its `justify` follows the spin automatically, so a label rotated 45 degrees under a horizontal axis hangs from its right end. Use **HLabel** and **VLabel** for the two directions.

Parameters:
- `children` — the `Label` elements to place
- `direc` = `h` — the direction the labels are spaced along, `h` or `v`
- any other attributes are forwarded to each label

Label parameters:
- `children` — the label text or a single element
- `loc` — the position along the axis at which to place the label
- `direc` = `h` — the direction of the axis the label belongs to
- `spin` = `0` — the rotation of the label in degrees
- `justify` — the justification of the label within its box; defaults to a value derived from `spin` and `direc`

**Example**

Prompt: tick labels along the bottom and left of a square, laid out the way an axis

Generated code:
```jsx
// places them: each strip is thin, and each label gets a square box the
// strip's width on a side, so the text is that tall. One label is spun and
// one is a math element
<Group>
  <Rect rect={[0.2, 0, 1, 0.8]} stroke-dasharray={4} opacity={0.5} />
  <HLabels rect={[0.2, 0.83, 1, 0.88]}>
    <Label loc={0.1}>zero</Label>
    <Label loc={0.4}>one</Label>
    <Label loc={0.65} spin={-45}>spun</Label>
    <Label loc={0.9} color={blue}>three</Label>
  </HLabels>
  <VLabels rect={[0.12, 0, 0.17, 0.8]} justify="right">
    <Label loc={0.2}>high</Label>
    <Label loc={0.5}><Latex>{"x^2"}</Latex></Label>
    <Label loc={0.8}>low</Label>
  </VLabels>
</Group>
```

## Mesh

*Inherits*: **Scale** > **Group** > **Element**

Draws a set of parallel grid lines over its whole box: a **Scale** whose ticks span the full cross direction. **HMesh** places vertical lines at positions along the horizontal axis and **VMesh** places horizontal lines at positions along the vertical axis, which is what **Plot** draws for `xgrid` and `ygrid`. **Mesh2D** combines the two into a full grid.

The locations are in the element's coordinate space, given by `xlim`/`ylim` or `coord`, so a mesh inside a **Graph** lines up with data coordinates; when `locs` is a count, the lines are spread evenly over that range.

Parameters:
- `locs` = `10` — either an integer for evenly spaced lines, or a list of line locations
- `direc` = `h` — the axis the lines are spaced along, `h` or `v`; the lines run the other way
- `xlim`/`ylim`/`coord` — the coordinate range, used to spread a count of `locs` and to place a list of them
- any other attributes are forwarded to the lines

Mesh2D parameters:
- `locs` = `10` — the line count or locations used for both directions
- `xlocs`/`ylocs` — the counts or locations for each direction, overriding `locs`
- `xlim`/`ylim`/`coord` — the coordinate range, as above

**Example**

Prompt: a faint grid under a sine curve, drawn in data coordinates, with a heavier

Generated code:
```jsx
// vertical mesh at the multiples of pi
<Graph aspect={2} xlim={[0, 2*pi]} ylim={[-1, 1]}>
  <Mesh2D xlocs={13} ylocs={5} opacity={0.15} />
  <HMesh locs={[pi, 2*pi]} stroke={blue} stroke-dasharray={4} />
  <SymLine fy={sin} stroke={red} stroke-width={2} />
</Graph>
```

## Legend

*Inherits*: **Frame** > **Group** > **Element**

A boxed legend: a column of badges, each beside its label, in a rounded **Frame** with a solid background so it can sit over the contents of a **Graph** or **Plot**. Each child is a badge specification carrying a `label`. A badge is either an element (a **Dot**, a dashed **Line**, a coloured **Rect**, …), which is used as is with its own aspect, or an object of attributes such as `{ stroke: blue, label: 'series' }`, which becomes a short line in that style. Labels are strings, set as text, or elements.

The legend gets an aspect from its rows, so place it in a graph with `pos` and `ysize` (or `rad`) in the graph's coordinates.

Parameters:
- `children` — the badge specifications, each with a `label`
- `vspacing` = `0.1` — the vertical spacing between rows
- `hspacing` = `0.25` — the gap between a badge and its label, relative to the badge
- `padding` = `0.05` — the padding inside the frame
- `rounded` = `0.025` — the corner radius of the frame
- `fill` = `white` — the background colour of the frame
- `justify` = `left` — the horizontal justification of the rows

Subunit names:
- `badge` — forwarded to the badges built from attribute objects
- `text` — forwarded to the labels built from strings

**Example**

Prompt: two curves with a legend in the corner: a solid blue line, a dashed red

Generated code:
```jsx
// line, and a green dot as the badge for a set of points
<Plot aspect={2} xlim={[0, 2*pi]} ylim={[-1.2, 1.2]} margin={0.15}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
  <SymLine fy={cos} stroke={red} stroke-width={2} stroke-dasharray={5} />
  <SymPoints fy={x => 0.5*sin(2*x)} N={12} fill={green} point-size={0.05} />
  <Legend pos={[5.2, 0.85]} ysize={0.7} vspacing={0.15}>
    {[
      { stroke: blue, stroke_width: 2, label: 'sine' },
      { stroke: red, stroke_width: 2, stroke_dasharray: 5, label: 'cosine' },
      <Box padding={0.2} label="samples"><Dot fill={green} /></Box>,
    ]}
  </Legend>
</Plot>
```

## BarPlot

*Inherits*: **Plot** > **Group** > **Element**

Makes a plot featuring a bar graph. This largely wraps the functionality of **Plot** but takes care of labelling and arranging the `xaxis` information. You can provide `label` and `value` attributes to the child elements. The **Bar**/**VBar**/**HBar** elements are just very thin wrappers around **Rect** elements, and you can use other elements in their place if you wish.

To layout just the bars without axes, use the **Bars** element directly, which this wraps using **Plot**. This way, you can plot other elements alongside the bars, such as labels or error bars. By default, the bars will be placed at `[0, ..., N-1]` along the x-axis.

Child parameters:
- `label` — the label for the bar
- `value` — the height of the bar

Parameters:
- `direc` = `v` — the orientation of the bars in the plot

Subunit names:
- `bar` — keywords to pass to the underlying **Bars** element

**Example**

Prompt: A plot with three bars with black borders at "A", "B", and "C". The first bar is red and is the shortest, the second bar is blue and is the tallest, while the third bar is green and its height is in between.

Generated code:
```jsx
<BarPlot ylim={[0, 10]} yticks={6} ygrid title="Example BarPlot" xlabel="Category" ylabel="Value" margin={0.25}>
  <Bar label="A" value={3} fill={red} />
  <Bar label="B" value={8.5} fill={blue} />
  <Bar label="C" value={6.5} fill={green} />
</BarPlot>
```
