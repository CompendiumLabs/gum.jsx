// A plot of an inverted sine wave where the line markers are sized in proportion to the amplitude and the color ranges from blue to red depending on the phase. The x-axis ticks are labeled with multiples of π. The x-axis is labeled "phase" and the y-axis is labeled "amplitude". The title is "Inverted Sine Wave".
const func = x => -sin(x)
const pal = palette(blue, red, [-1, 1])
const size = (x, y) => 0.1 * (1+abs(y))/2
const xticks = linspace(0, 2, 6).slice(1).map(x => [x*pi, `${rounder(x, 1)} π`])
return <Plot xlim={[0, 2*pi]} ylim={[-1, 1]} aspect={1.5} xanchor={0} xaxis_tick_pos="both" xticks={xticks} grid xlabel="phase" ylabel="amplitude" title="Inverted Sine Wave" margin={0.25}>
  <DataPath fy={func} />
  <DataPoints fy={func} size={size} N={21}>
    { (x, y) => <Circle fill={pal(y)} /> }
  </DataPoints>
</Plot>
