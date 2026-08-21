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
