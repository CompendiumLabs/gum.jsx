<TitleFrame margin padding rounded={0.02} stroke="#aaa" title="Basic Shapes">
  <VStack spacing>
    <TextBox wrap-width={20}>Here we have a basic square dude going on. Then adding more text makes it wrap.</TextBox>
    <HStack stack-size={1/3} stack-expand={false} spacing={0.2}>
      <Square rounded fill={blue} />
      <Circle fill={red} />
    </HStack>
    <TextBox wrap-width={20}>Here we have the circle being displayed. Now the text is wrapping over to the next line, and what's this its getting even large. When will the system break down?</TextBox>
  </VStack>
</TitleFrame>
