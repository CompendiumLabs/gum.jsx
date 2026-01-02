# Graph

*Inherits*: **Group** > **Element**

This is the core graphing functionality used in **Plot** without the axes and labels. The default coordinate system is the unit square, `[0, 0, 1, 1]`. This can be overridden with custom `xlim`/`ylim` specifications. The Elements that are passed to **Graph** can express their position and size information in this new coordinate system.

Parameters:
- `xlim`/`ylim` = `[0, 1]` — the range over which to graph
- `padding` = `0` — limit padding to add when auto-detected from `elems`
- `coord` — the coordinate system to use for the graph (overrides `xlim`/`ylim`)

## Example

Prompt: a series of closely spaced squares rotating clockwise along a sinusoidal path

Generated code:
```jsx
<Graph padding={[0.2, 0.4]}>
  <SymPoints fy={sin} xlim={[0, 2*pi]} size={0.5} N={150}>
    { x => <Square rounded spin={r2d*x} /> }
  </SymPoints>
</Graph>
```
