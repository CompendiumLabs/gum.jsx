# Slide

*Inherits*: [TitleFrame](/docs/TitleFrame) > [Frame](/docs/Frame) > [Group](/docs/Group) > [Element](/docs/Element)

Create a presentation slide with a title and some content. This stacks various `Text` elements and other `Element`s vertically. It will automatically apply the specified `wrap` value to the text elements. It defaults to using a `TitleFrame` for the title and a light gray rounded border.

Parameters:
- `children` = `[]` — a list of strings or `Element`s to array vertically
- `wrap` = `25` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)

Subunits:
- `title` — the title element
- `text` — the text elements
