# Colors

There are a few functions designed to manipulate colors in HEX, RGB, and HSL formats.

## Constants

- `none` = `'none'` — a transparent color
- `white` = `'#ffffff'` — a white color
- `black` = `'#000000'` — a black color
- `blue`= `'#1e88e5'` — a neon blue color
- `red`= `'#ff0d57'` — a neon red color
- `green`= `'#4caf50'` — a neon green color
- `yellow`= `'#ffb300'` — a neon yellow color
- `purple`= `'#9c27b0'` — a neon purple color
- `gray`= `'#f0f0f0'` — a light gray color

## Functions

- `hex2rgb(hex)` — convert a HEX color string to an RGB array
- `rgb2hex(rgb)` — convert an RGB array to a HEX color string
- `rgb2hsl(rgb)` — convert an RGB array to an HSL array
- `palette(beg, end)` — create a palette function that interpolates between two colors

## Example

Prompt: A plot of an inverted sine wave where the line markers are sized in proportion to the amplitude and the color ranges from blue to red depending on the phase. The x-axis ticks are labeled with multiples of π. The x-axis is labeled "phase" and the y-axis is labeled "amplitude". The title is "Inverted Sine Wave".

Generated code:
```jsx
const func = x => -sin(x)
const pal = palette(blue, red, [-1, 1])
const size = (x, y) => 0.1 * (1+abs(y))/2
const xticks = linspace(0, 2, 6).slice(1).map(x => [x*pi, `${rounder(x, 1)} π`])
return <Plot xlim={[0, 2*pi]} ylim={[-1, 1]} aspect={1.5} xanchor={0} xaxis-tick-side="both" xticks={xticks} grid xlabel="phase" ylabel="amplitude" title="Inverted Sine Wave" margin={0.25}>
  <SymLine fy={func} />
  <SymPoints fy={func} size={size} N={21}>
    { (x, y) => <Circle fill={pal(y)} /> }
  </SymPoints>
</Plot>
```
