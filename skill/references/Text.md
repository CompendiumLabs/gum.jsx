# Text

*Inherits*: **VStack** > **Element**

Displays text and other elements. Uses built-in browser facilities when available to calculate font size and aspect ratio. Note that you will typically not set the font size of the text here, as this will fill the entire space with the provided text.

If `wrap` is specified, the text will be wrapped to the specified width. In either case, single newlines will be respected, though whitespace will be compressed. There are two wrapper elements related to text:

- **TextBox** / **TextFrame** can handle text with a border and background
- **TextStack** can handle multiple lines of text that are passed in as an array

Parameters:
- `children` — the text to display
- `wrap` = `null` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)
- `spacing` = `0.2` — the spacing between lines of text
- `justify` = `'left'` — the horizontal justification of the text
- `color` = `black` — sets the text color using both stroke and fill (this is the usual way)
- `font-family` = `'IBMPlexSans'` — the font family (for display and size calculations)
- `font-weight` = `100` — the font weight (for display and size calculations)

## Example

Prompt: The text "Hello World! You can mix text and other elements together." with a blue square between "and" and "other". Put it in a rounded frame with padding.

Generated code:
```jsx
<TextFrame rounded wrap={10}>
  Hello World! You can mix text and <Square rounded fill={blue} /> other elements together.
</TextFrame>
```
