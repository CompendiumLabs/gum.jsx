// a math row with upright text between the symbols, one word in bold, above a sans-serif note with a variable in it
<Frame padding rounded>
  <VStack spacing={0.1}>
    <MathText>
      {"x = 1"}
      <TextMode> if </TextMode>
      {"y > 0"}
      <TextMode>, and </TextMode>
      <TextMode bold>otherwise </TextMode>
      {"x = 0"}
    </MathText>
    <MathText>
      <TextMode family="sans">(where </TextMode>
      {"y"}
      <TextMode family="sans"> is the input and </TextMode>
      {"x"}
      <TextMode family="sans"> the output)</TextMode>
    </MathText>
  </VStack>
</Frame>
