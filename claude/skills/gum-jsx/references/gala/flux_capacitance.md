# Flux Capacitance

This is a simple example of a multi-element **Plot**. The figure combines a shaded **SymFill** region with two overlaid **SymLine** curves, then lets **Plot** handle the axes, grid, labels, and title. It is a nice pattern when you want several related elements to share the same plotting frame.

One useful detail is that `xlim` and `ylim` are flexible. If you put them on the outer **Plot**, they get pushed down to the children automatically. But you can also put limits on the individual children, which is handy when different plotted elements want different domains.

**Code**

```jsx
<Plot grid margin={0.3} xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} xlabel="Phase (radians)" ylabel="Interference" title="Flux Capacitance">
  <SymFill fy1={sin} fy2={cos} fill={blue} opacity={0.25} />
  <SymLine fy={sin} />
  <SymLine fy={cos} />
</Plot>
```