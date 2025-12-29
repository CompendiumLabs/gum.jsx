// plot an inverted sine wave with ticks labeled in multiples of π. There is a faint dashed grid. The x-axis is labeled "phase" and the y-axis is labeled "amplitude". The title is "Inverted Sine Wave".
const xticks = linspace(0, 2, 6).slice(1).map(x => [x*pi, `${rounder(x, 1)} π`])
return <Plot aspect={phi} margin={0.25} xanchor={0} xticks={xticks} xlabel="phase" ylabel="amplitude" title="Inverted Sine Wave" xaxis-tick-side="both" grid grid-stroke-dasharray={3}>
  <DataPath fy={x => -sin(x)} xlim={[0, 2*pi]} />
</Plot>
