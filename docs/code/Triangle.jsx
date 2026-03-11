// make a diamond shape with two triangles, the triangle on top is red and the triangle on the bottom is blue
<Frame margin rounded padding fill>
  <VStack>
    <Triangle fill={red} aspect={1} stroke-width={0} />
    <Triangle fill={blue} aspect={1} stroke-width={0} vflip />
  </VStack>
</Frame>
