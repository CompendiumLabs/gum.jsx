# Axis Arrows

This example adds a mathematical touch to a standard **Plot**. The logarithm is drawn with a single **SymLine**, while **Plot** supplies the coordinate limits, tick labels, and matching grid. Setting `xaxis-arrow-right` and `yaxis-arrow-top` decorates only the increasing end of each **Axis**, so the frame reads as a pair of directed coordinate axes rather than a boxed chart.

The nested prefixes are the useful part. `xaxis-` and `yaxis-` target one axis at a time, while `axis-arrow-curve={0.5}` applies the same arrowhead styling to both. The explicit `range` and `linspace` tick arrays also determine the grid locations, keeping the grid lines and labels aligned automatically.

**Code**

```jsx
<Plot aspect={phi} margin={0.15} xlim={[1, 5]} ylim={[0, 2]} xticks={range(1, 5)} yticks={linspace(0, 1.5, 4)} grid xaxis-arrow-right yaxis-arrow-top axis-arrow-curve={0.5}>
  <SymLine fy={log} xlim={[1, 5]} stroke={blue} stroke-width={3} />
</Plot>
```