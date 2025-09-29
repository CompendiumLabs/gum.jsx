<TitleFrame margin padding rounded={0.02} title="Basic Shapes">
  <VStack spacing>
    <TextBox wrap-width={20}>Here we have a basic square dude going on. The text is wrapping.</TextBox>
    <Frame aspect={5}><HStack spacing={0.1}>
      <Square rounded fill={blue} />
      <Circle fill={red} />
    </HStack></Frame>
    <Frame aspect={5} border rounded padding border-stroke="#aaa"><Latex>{"\\frac{1}{\\sqrt{2\\pi}} \\int_0^1 \\exp(-x^2) dx = 1"}</Latex></Frame>
    <TextBox wrap-width={20}>Here we have the circle being displayed. The text is wrapping here too, but differently like.</TextBox>
  </VStack>
</TitleFrame>
