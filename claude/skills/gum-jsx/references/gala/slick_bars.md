# Slick Bars

This one is really about axis styling. The bars themselves are simple, but the chart gets its contemporary benchmark-graph look from the customized **Plot**: trimmed axis extents, outer ticks, and the sparse framing around the data.

It is also a good example of using `Bars` inside `Plot` rather than reaching for **BarPlot**. `BarPlot` is convenient when you want the standard bar-chart setup, but here we want tighter control over the axis appearance and we also want to place percentage labels manually above each bar. Wrapping `Bars` in `Plot` leaves that structure exposed.

The rotated x-axis labels are another important touch. With text labels this is often necessary, especially when the names are long or numerous, and `xaxis-label-spin={-45}` solves the overlap cleanly without having to make the plot much wider.

**Code**

```jsx
const [labs, vals] = zip(
  ["GPT-4o", 0.4], ["OpenAI o1", 3.2], ["OpenAI o4-mini", 8.3], ["Gemini 3 Pro", 12.4],
  ["OpenAI o3", 14.1], ["Grok 4", 15.9], ["Claude Opus 4.5", 17.5], ["GPT-5.2", 25.2],
)
return <Plot
  aspect={1.6} margin={[0.2, 0.1, 0.2, 0.35]} ylim={[0, 30]} xanchor={-0.6} yanchor={-0.55}
  xticks={enumerate(labs)} yticks={linspace(0, 30, 7)} axis-tick-side="outer" xaxis-line-lim={[0, 7]}
  xaxis-label-spin={-45}
>
  <Bars rounded={0.1} width={0.85} data={vals} />
  {vals.map((s, i) => <Span pos={[i, s+1.3]} yrad={0.75}>{`${s}%`}</Span> )}
</Plot>
```