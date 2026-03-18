# Punk Rock

This one is very simple, but it is a nice reminder that layout elements can be graphic design tools too. The three **TextFrame** boxes are arranged with an `HStack`, given different corner roundings, and then wrapped in a larger rotated frame to get the sticker-like composition.

Most of the energy comes from the framing rather than the text itself. The bright blocks, asymmetric rounding, and overall rotation are enough to push the piece toward a poster or logo treatment with very little code.

```jsx
<Frame rounded={0.15} padding margin fill={gray} rotate={-25}>
  <HStack aspect={7.5} spacing={0.075}>
    <TextFrame fill={red} padding rounded={[0.1, 0, 0, 0.1]}>Punk</TextFrame>
    <TextFrame fill={blue} padding rounded={0}>Rock</TextFrame>
    <TextFrame fill={green} padding rounded={[0, 0.1, 0.1, 0]} aspect>→</TextFrame>
  </HStack>
</Frame>
```