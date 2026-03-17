# Slick Bars

This one is really about axis styling. The bars themselves are simple, but the chart gets its contemporary benchmark-graph look from the customized [Plot](/docs/Plot): trimmed axis extents, outer ticks, and the sparse framing around the data.

It is also a good example of using `Bars` inside `Plot` rather than reaching for [BarPlot](/docs/BarPlot). `BarPlot` is convenient when you want the standard bar-chart setup, but here we want tighter control over the axis appearance and we also want to place percentage labels manually above each bar. Wrapping `Bars` in `Plot` leaves that structure exposed.

The rotated x-axis labels are another important touch. With text labels this is often necessary, especially when the names are long or numerous, and `xaxis-label-spin={-45}` solves the overlap cleanly without having to make the plot much wider.