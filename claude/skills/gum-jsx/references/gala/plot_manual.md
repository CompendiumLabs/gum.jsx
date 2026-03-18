# Plot Manual

This is basically the manual version of **Plot**. Instead of using the wrapper, it builds the graph from a `Group` with an explicit coordinate system, then adds the mesh, axes, and curve one piece at a time.

That makes it a useful example if you want to understand what **Plot** is abstracting away. You get direct control over where the axes sit and how big they are, which is why the code computes the small `ratio` factor before placing the vertical axis. Once you are doing this kind of thing often, though, it is usually easier to go back to **Plot**.

```jsx
const aspect = 2
const ratio = pi / aspect
return <Box margin={0.3}>
  <Group coord={[0, 1, 2*pi, -1]} aspect={aspect}>
    <HMesh locs={5} lim={[0, 2*pi]} opacity={0.3} />
    <VMesh locs={5} lim={[-1, 1]} opacity={0.3} />
    <HAxis ticks={5} lim={[0, 2*pi]} pos={[pi, -1]} rad={[pi, 0.04]} />
    <VAxis ticks={5} lim={[-1, 1]} pos={[0, 0]} rad={[0.04*ratio, 1]} />
    <SymLine fy={sin} xlim={[0, 2*pi]} />
  </Group>
</Box>
```