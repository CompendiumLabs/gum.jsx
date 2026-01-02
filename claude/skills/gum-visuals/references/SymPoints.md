# SymPoints

*Inherits*: **Group** > **Element**

Flexible interface to generate sets of points symbolically or in combination with fixed inputs. The most common usage is to specify the range for x-values with `xlim` and a function to plot with `fy`. But you can specify the transpose with `ylim`/`fx`, or do a fully parametric path using `tlim`/`fx`/`fy`.

You can also specify the radius of the points functionally with `size` and the shape with `children`. Both of these functions take `(x, y, t, i)` values as inputs and return the desired value for each point.

Parameters:
- `fx`/`fy` — a function mapping from x-values, y-values, or t-values
- `size` = `0.025` — a size or a function mapping from `(x, y, t, i)` values to a size
- `children` = `Dot` — a shape or function mapping from `(x, y, t, i)` values to a shape
- `xlim`/`ylim`/`tlim` — a pair of numbers specifying variable limits
- `xvals`/`yvals`/`tvals` — a list of x-values, y-values, or t-values to use
- `N` — number of data points to generate when using limits

## Example

Prompt: A plot of a sine wave in blue. There are white pill shaped line markers along the sine wave that are rotated to follow the slope of the curve.

Generated code:
```jsx
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} fill grid clip margin={[0.25, 0.1]}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
  <SymPoints fy={sin} size={0.125} N={11}>
    { (x, y) => <Rect fill={white} rounded={0.3} aspect={2} spin={-r2d*atan(cos(x))} /> }
  </SymPoints>
</Plot>
```
