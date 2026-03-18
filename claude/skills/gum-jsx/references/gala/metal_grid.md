# Metal Grid

This one is mostly about layering simple pieces to get a polished surface. A **Grid** of rounded rectangles creates the tiled background, and a column-wise `palette` turns that grid into a smooth cyan-to-violet gradient.

The interesting part is the overlaid spline. The code draws the same **Spline** twice, once as a wide translucent stroke and once as a thinner solid stroke, which creates the soft glowing trace. That kind of doubled stroke is a good general trick when you want a line to feel luminous without doing anything more complicated.

The nested **Frame**s matter too. They give the piece its metallic bezel and inset-screen look, so the final image reads less like a raw grid and more like a display panel.

**Code**

```jsx
const [ n, m ] = [ 9, 16 ]
const pal = palette('#00d4ff', '#7c3aed', [0, m-1])
const pts = [
  [0.12, 0.55], [0.25, 0.20], [0.42, 0.78],
  [0.60, 0.30], [0.78, 0.72], [0.88, 0.45],
]
return <Frame border={2} rounded={0.03} fill={darkgray} padding={0.03} margin>
  <Frame rounded={0.02} fill={black} padding={0.025}>
    <Grid rows={n} cols={m} opacity={0.7}>
      {range(0, n*m).map(i => <Rectangle rounded={0.2} fill={pal(i%m)} /> )}
    </Grid>
    <Group stroke-linecap="round">
      <Spline curve={0.65} stroke={gray} stroke-width={15} opacity={0.25} points={pts} />
      <Spline curve={0.65} stroke={gray} stroke-width={5} points={pts} />
    </Group>
  </Frame>
</Frame>
```