# Points

*Inherits*: **Group** > **Element**

Place copies of a common shape at various points. The radius can be specified by the `size` keyword and overridden for particular children. The default shape is a black dot.

Keyword arguments:
- `children` — a list of points, where each point is either an `[x,y]` pair
- `shape` = `Dot` — the default shape to use for children
- `size` = `0.025` — the default radius to use for children
- `...` = `{}` — additional attributes are passed to the default shape (like `stroke` or `fill`)

## Example

Prompt: A plot of three different increasing curves of varying steepness and multiple points spaced at regular intervals. The x-axis label is "time (seconds)", the y-axis label is "space (meters)", and the title is "Spacetime Vibes". There are axis ticks in both directions with assiated faint grid lines.

Generated code:
```jsx
<Plot xlim={[-1, 1]} ylim={[-1, 1]} margin={0.3} grid xlabel="time (seconds)" ylabel="space (meters)" title="Spacetime Vibes">
  <Points size={0.02}>{[
    [0, 0.5], [0.5, 0], [-0.5, 0], [0, -0.5]
  ]}
  </Points>
  <Rect pos={[0.5, 0.5]} rad={0.1} />
  <Circle pos={[-0.5, -0.5]} rad={0.1} />
  {[0.5, 0.9, 1.5].map(a =>
    <SymLine fy={x => sin(a*x)} />
  )}
</Plot>
```
