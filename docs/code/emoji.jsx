// draw a row of emojis with various faces
const tags = [ 'grinning', 'neutral_face', 'confused', 'scream', 'joy', 'heart_eyes' ]
return <HStack spacing={0.1}>
  {tags.map(t =>
    <Frame rounded fill>
      <Emoji>{t}</Emoji>
    </Frame>
  )}
</HStack>
