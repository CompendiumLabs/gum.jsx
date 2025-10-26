// draw a row of emojis with various faces
<HStack spacing={0.1}>
  { [ 'grinning', 'neutral_face', 'scream', 'joy', 'heart_eyes' ].map(t =>
    <Frame rounded fill>
      <Emoji>{t}</Emoji>
    </Frame>
  ) }
</HStack>
