# The Nexus

This is a simple but effective generative plot. Each curve is the same damped cosine profile with a different phase shift, and the whole bundle is produced by mapping over a list of phase values.

The visual style comes from a few restrained choices. The axes are turned off (`axis = false`), the dense grid is left on, and the stroke colors are interpolated from red to blue across the family of curves with `interp`. That is enough to make the figure feel atmospheric without requiring any extra structure beyond a loop over **SymSpline** elements.

**Code**

```jsx
<Frame border={2} rounded={0.02} clip margin>
  <Plot
    aspect={1.5} axis={false} xgrid={31} ygrid={21}
    xlim={[-4*pi, 4*pi]} ylim={[-1.5, 1.5]}
  >
    { linspace(0, pi, 10).map(p =>
      <SymSpline
        fy={x => cos(x-p) * exp(-0.05*x*x)}
        stroke={interp(red, blue, p/pi)}
        stroke-width={2} N={50}
      />
    )}
  </Plot>
</Frame>
```