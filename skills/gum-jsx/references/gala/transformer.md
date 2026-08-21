# Transformer

This is a block diagram of a decoder-only transformer, drawn as a single vertical column from input tokens up to output probabilities. It is a good illustration of building a diagram out of small local components rather than placing things by hand.

Three helpers do almost all of the work. `Block` is a rounded **Frame** with a fixed `aspect` and a centered **Text** label, `Flow` is a one-segment **Arrow** pointing upward, and `tint` lightens each palette color with `interp` so the fills stay pastel. Because every piece declares its own aspect ratio, the enclosing **VStack** can work out all of the heights itself, and the arrows automatically line up with the blocks they connect.

The repeated layer is just a nested **Frame** wrapped around its own **VStack**, which gives the inner group its border and padding for free. The `Loop` arrow beside it is the one place that steps outside the unit box: its points run from `-yside` to `1 + yside`, so the dashed path leaves the layer frame, arcs around the right side, and rejoins below it. Corners are softened with `rounded` rather than drawn as separate segments, and the `× N` label is a **TextBox** with a white fill that sits on top of the path to knock a gap in it.

The `arrow-size` and `arrow-curve` props are also worth noting. These are prefixed attributes that **Arrow** forwards to its **ArrowHead**, which is how the flow arrows and the much longer loop arrow end up with heads of visibly different sizes without defining two separate components.

**Code**

```jsx
// PROMPT: make an architecture diagram for a transformers-style LLM. keep it clean and elegant. try to avoid hard-coding positions.

// tinted color helper
const tint = c => interp(white, c, 0.25)

// a labeled block with rounded corners and a color fill
const Block = ({ label, color, ...attr }) => (
  <Frame rounded aspect={6} margin={[0.15, 0]} fill={tint(color)} {...attr}>
    <Text size={[0.9, 0.45]}>{label}</Text>
  </Frame>
)

// a short upward flow arrow
const Flow = ({ aspect = 10, ...attr }) => (
  <Arrow points={[[0.5, 1], [0.5, 0]]} aspect={aspect} arrow-size={0.6} arrow-curve={0.4} {...attr} />
)

// loop arrow tapping the residual stream above the layer box and rejoining below it
const [ xside, yside ] = [ 0.2, 0.21 ]
const Loop = (attr) => (
  <Group {...attr}>
    <Arrow
      points={[[0.5, -yside], [1+xside, -yside], [1+xside, 1+yside], [0.5, 1+yside]]}
      rounded={0.05} arrow-size={0.09} arrow-curve={0.4} line-stroke-dasharray={5}
    />
    <TextBox pos={[1+xside, 0.5]} ysize={0.15} fill={white} padding={0.3}>× N</TextBox>
  </Group>
)

return <TitleFrame title="Transformer Architecture" rounded={0.025} margin={0.08} padding={0.08} title-size={0.05}>
  <VStack>
    <TextBox aspect={8} padding={[0, 0.1]}>Output Probabilities</TextBox>
    <Flow />
    <Block label="Softmax" color={red} />
    <Flow />
    <Block label="Linear" color={red} />
    <Flow aspect={7} />
    <Frame rounded padding={[0.05, 0.1]} margin={[0.15, 0]}>
      <VStack>
        <Block label="Add & Norm" color={yellow} />
        <Flow />
        <Block label="Feed Forward" color={green} />
        <Flow />
        <Block label="Add & Norm" color={yellow} />
        <Flow />
        <Block label="Masked Multi-Head Attention" color={blue} />
      </VStack>
      <Loop />
    </Frame>
    <Flow aspect={7} />
    <Block label="Token + Positional Embedding" color={purple} />
    <Flow />
    <TextBox aspect={8} padding={[0, 0.1]}>Input Tokens</TextBox>
  </VStack>
</TitleFrame>
```