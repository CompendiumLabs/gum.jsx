// one large donut in a frame stacked on top of two smaller side-by-side framed donuts
const Donut = () => <Frame><Emoji>🍩</Emoji></Frame>
return <Frame margin>
  <VStack>
    <Donut/>
    <HStack>
      <Donut/>
      <Donut/>
    </HStack>
  </VStack>
</Frame>
