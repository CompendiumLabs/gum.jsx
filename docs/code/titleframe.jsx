// Various food emojis are arrnaged in a spaced out grid and framed with the title "Fruits & Veggies". Each emoji is framed by a rounded square with a gray background.
const emoji = [ '🍇', '🥦', '🍔', '🍉', '🍍', '🌽', '🍩', '🥝', '🍟' ]
return <TitleFrame title="Fruits & Veggies" margin padding rounded>
  <Grid rows={3} spacing={0.05}>
    {emoji.map(e =>
      <Frame aspect rounded fill padding><Text>{e}</Text></Frame>
    )}
  </Grid>
</TitleFrame>
