// a wide blue rectangle on top, with red and green squares side by side on the bottom. each one has rounded corners.
<VStack spacing>
  <Rectangle rounded aspect={2} fill={blue} />
  <HStack spacing>
    <Square rounded fill={red} />
    <Square rounded fill={green} />
  </HStack>
</VStack>