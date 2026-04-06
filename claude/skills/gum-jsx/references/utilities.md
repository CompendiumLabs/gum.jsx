# Utilities Elements

## Math

Here we collect a variety of global mathematical functions and constants. You can still use the core JavaScript `Math` library as well.

## Constants

- `e` — the base of the natural logarithm (e)
- `pi` — the geometric constant (π)
- `phi` — the golden ratio (φ)
- `r2d` — the conversion factor between radians and degrees (180/π)
- `d2r` — the conversion factor between degrees and radians (π/180)

## Functions

- `exp(x)` — the exponential function
- `log(x)` — the natural logarithm
- `log10(x)` — the base 10 logarithm
- `sin(x)` — the sine function
- `cos(x)` — the cosine function
- `tan(x)` — the tangent function
- `abs(x)` — the absolute value
- `pow(x, y)` — the power function
- `sqrt(x)` — the square root function
- `sign(x)` — the sign function
- `floor(x)` — the floor function
- `ceil(x)` — the ceiling function
- `round(x)` — the rounding function
- `clamp(x, lim=[0, 1])` — clamp `x` to the range `lim`
- `rescale(x, lim=[0, 1])` — linearly rescale `x` to the range `lim`
- `polar([radius, angle], center=[0, 0])` — convert polar coordinates to a 2D point

Angles use gum's usual screen-space convention: `0` points right and `90` points down.

**Example**

Prompt: use polar to place points around a circle

Generated code:
```jsx
const center = [0.5, 0.5]
const ring = range(10).map(i => {
  const radius = i % 2 == 0 ? 0.32 : 0.16
  return polar([radius, -90 + 36 * i], center)
})
const spokes = range(5).map(i => polar([0.32, -90 + 72 * i], center))

return <Group aspect={1}>
  <Circle pos={center} size={0.64} stroke={darkgray} />
  <Shape points={ring} stroke={blue} stroke-width={2} />
  {spokes.map(pos => <Line points={[center, pos]} stroke={red} stroke-width={1.5} />)}
  {ring.map(pos => <Dot pos={pos} size={0.03} fill={blue} />)}
</Group>
```

## Arrays

There are a number of functions designed to make working with arrays easier. They largely mimic similar functions found in core Python or the `numpy` library.

## Functions

- `zip(...arrs)` — combine arrays `arrs` element-wise
- `min(arrs)` — the minimum of arrays `arrs`
- `max(arrs)` — the maximum of arrays `arrs`
- `reshape(arr, shape)` — reshape array `arr` to given dimensions `shape`
- `split(arr, len)` — split array `arr` into subarrays of length `len`
- `sum(arr)` — sum the elements of array `arr`
- `all(arr)` — check if all elements of array `arr` are true
- `any(arr)` — check if any element of array `arr` is true
- `cumsum(arr, first=true)` — compute the cumulative sum of array `arr` with the option to start at zero
- `norm(arr, degree=1)` — compute the `degree`-norm of array `arr`
- `normalize(arr, degree=1)` — normalize array `arr` to have `degree`-norm one
- `range(i0, i1, step=1)` — generate an array of evenly spaced values from `i0` to `i1` with spacing `step`
- `linspace(x0, x1, n=50)` — generate an array of `n` evenly spaced values between `x0` and `x1`
- `enumerate(arr)` — pair each element of array `arr` with its index
- `repeat(x, n)` — repeat array `x` a total of `n` times
- `meshgrid(x, y)` — create a mesh grid from arrays `x` and `y`
- `lingrid(xlim, ylim, N)` — create a 2D grid of `N = [Nx, Ny]` points over the ranges `xlim` and `ylim`

**Example**

Prompt: a scatter plot of points with emojis for: mount fuji, a rocket, a whale, a watermellon, and a donut

Generated code:
```jsx
<Plot xlim={[0, 6]} ylim={[0, 6]} xticks={7} yticks={7} margin={0.15}>
  { [ '🗻', '🚀', '🐋', '🍉', '🍩' ].map((e, i) =>
    <Text pos={[i+1, i+1]} size={0.8}>{e}</Text>
  ) }
</Plot>
```

## Colors

There are a few functions designed to manipulate colors in HEX, RGB, and HSL formats.

**Constants**

- `none` = `'none'` — a transparent color
- `white` = `'#ffffff'` — a white color
- `black` = `'#000000'` — a black color
- `blue`= `'#1e88e5'` — a neon blue color
- `red`= `'#ff0d57'` — a neon red color
- `green`= `'#4caf50'` — a neon green color
- `yellow`= `'#ffb300'` — a neon yellow color
- `purple`= `'#9c27b0'` — a neon purple color
- `gray`= `'#f0f0f0'` — a light gray color

**Functions**

- `hex2rgb(hex)` — convert a HEX color string to an RGB array
- `rgb2hex(rgb)` — convert an RGB array to a HEX color string
- `rgb2hsl(rgb)` — convert an RGB array to an HSL array
- `palette(beg, end, lim=[0, 1])` — create a palette function that interpolates between two colors

**Example**

Prompt: A plot of an inverted sine wave where the line markers are sized in proportion to the amplitude and the color ranges from blue to red depending on the phase. The x-axis ticks are labeled with multiples of π. The x-axis is labeled "phase" and the y-axis is labeled "amplitude". The title is "Inverted Sine Wave".

Generated code:
```jsx
const func = x => -sin(x)
const pal = palette(blue, red, [-1, 1])
const size = (x, y) => 0.2 * (1+abs(y))/2
const shape = (x, y) => <Circle fill={pal(y)} />
const xticks = linspace(0, 2, 6).slice(1).map(x => [x*pi, `${rounder(x, 1)} π`])
return <Plot xlim={[0, 2*pi]} ylim={[-1, 1]} aspect={1.5} xanchor={0} xaxis-tick-side="both" xticks={xticks} grid xlabel="phase" ylabel="amplitude" title="Inverted Sine Wave" margin={0.25}>
  <SymLine fy={func} />
  <SymPoints fy={func} point-size={size} point-shape={shape} N={21}>
  </SymPoints>
</Plot>
```
