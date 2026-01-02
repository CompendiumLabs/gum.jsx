# TitleFrame

*Inherits*: **Frame** > **Element**

A special type of **Frame** that places a title element in a box centered on the line at the top of the frame. The title element can be either a proper Element or a string, in which case it will be wrapped in a **Text** element.

Parameters:
- `title` — the text or element to use as the title
- `title-size` = `0.05` — the size of the title element
- `adjust` = `true` — whether to adjust the padding and margin to account for the title element
- `border` = `1` — the outer frame border width to use

Subunits:
- `title` — the title element

## Example

Prompt: Various food emojis are arrnaged in a spaced out grid and framed with the title "Fruits & Veggies". Each emoji is framed by a rounded square with a gray background.

Generated code:
```jsx
const emoji = [ '🍇', '🥦', '🍔', '🍉', '🍍', '🌽', '🍩', '🥝', '🍟' ]
return <TitleFrame title="Fruits & Veggies" margin padding rounded>
  <Grid rows={3} spacing={0.05}>
    {emoji.map(e =>
      <Frame aspect rounded fill padding><Text>{e}</Text></Frame>
    )}
  </Grid>
</TitleFrame>
```
