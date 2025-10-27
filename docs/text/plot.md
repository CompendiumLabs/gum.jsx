# Plot

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Use [Graph](/docs/Graph) to plot one or more elements over the desired limits and frame them with axes. If not specified by `xlim` and `ylim`, the limits of the plot will be computed from the bounding box of the constituent elements. By default, the `aspect` will be the ratio of the range of the `xlim` and `ylim`. See [Axis](/docs/Axis) for more details on how to customize the axes, ticks, and labels.

Parameters:
- `xlim`/`ylim` = `[0, 1]` — the range over which to graph
- `xanchor`/`yanchor` — the value at which to place the respective axis. Note that the `xanchor` is a y-value and vice versa. Defaults to `xmin`/`ymin`
- `xticks`/`yticks` = `5` — either an integer for evenly spaced ticks, a list of tick locations, or list of tick `[location, label]` pairs (see [Axis](/docs/Axis) for more details)
- `grid`/`xgrid`/`ygrid` = `false` — whether to show a grid in the background. If `true`, the grid lines match the specified ticks. Alternatively, you can pass a list of positions to override this
- `xlabel`/`ylabel` — a string or **Element** to use as the respective label
- `title` — a string or **Element** to use as the title
- `padding` = `0` ­— additional padding to add to auto-detected coordinate limits
- `margin` = `0` — margin to add around the plot (needed to include labels and title)
- `border` = `0` — border width to use

Subunits:
- `axis`/`xaxis`/`yaxis` — the axes, including lines, ticks, and tick labels
- `grid`/`xgrid`/`ygrid` — the grid lines arrayed under the graph
- `label`/`xlabel`/`ylabel` — the axis label elements
- `title` — the plot title element
