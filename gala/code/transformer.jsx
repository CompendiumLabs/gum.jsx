// PROMPT: make an architecture diagram for a transformers-style LLM. keep it clean and elegant. try to avoid hard-coding positions.

// tinted color helper
const tint = c => interp(white, c, 0.25)

// a labeled block with rounded corners and a color fill
const Block = ({ label, color, ...attr }) => (
  <Frame rounded aspect={5.5} fill={tint(color)} {...attr}>
    <Text size={[0.88, 0.42]}>{label}</Text>
  </Frame>
)

// a short upward flow arrow
const Flow = (attr) => (
  <Arrow points={[[0.5, 1], [0.5, 0]]} aspect={0.5} stack-size={0.045} arrow-size={1} {...attr} />
)

// width share of the side channels flanking the layer frame
const side = 0.13

// a slimmer block inset to align with the layer frame width
const SlimBlock = (props) => (
  <HStack>
    <Group stack-size={side} />
    <Block {...props} />
    <Group stack-size={side} />
  </HStack>
)

// height share of the flow connectors above/below the layer frame
const flow = 0.13

// loop arrow tapping the residual stream above the layer box and rejoining below it
const Loop = (attr) => {
  const cx = 1 - 0.5 / side // residual stream center in loop-channel coords
  return <Group {...attr}>
    <Arrow
      points={[[cx, flow / 2], [0.55, flow / 2], [0.55, 1 - flow / 2], [cx, 1 - flow / 2]]}
      rounded={0.08} arrow-size={0.3} line-stroke-dasharray={3}
    />
    <TextBox pos={[0.55, 0.5]} ysize={0.09} fill={white} border={0} padding={0.3}>× N</TextBox>
  </Group>
}

return <TitleFrame title="Transformer Architecture" rounded={0.025} margin={0.08} padding={0.08} title-size={0.06}>
  <VStack>
    <TextBox stack-size={0.06} padding={[0, 0.1]}>Output Probabilities</TextBox>
    <Flow />
    <SlimBlock label="Softmax" color={red} />
    <Flow />
    <SlimBlock label="Linear" color={red} />
    <HStack>
      <Group stack-size={side} />
      <VStack>
        <Flow stack-size={flow} />
        <Frame rounded padding={0.06}>
          <VStack>
            <Block label="Add & Norm" color={yellow} />
            <Flow stack-size={0.07} />
            <Block label="Feed Forward" color={green} />
            <Flow stack-size={0.07} />
            <Block label="Add & Norm" color={yellow} />
            <Flow stack-size={0.07} />
            <Block label="Masked Multi-Head Attention" color={blue} />
          </VStack>
        </Frame>
        <Flow stack-size={flow} />
      </VStack>
      <Loop stack-size={side} />
    </HStack>
    <SlimBlock label="Token + Positional Embedding" color={purple} />
    <Flow />
    <TextBox stack-size={0.06} padding={[0, 0.1]}>Input Tokens</TextBox>
  </VStack>
</TitleFrame>
