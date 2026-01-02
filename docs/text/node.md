# Node

*Inherits*: [Frame](/docs/Frame) > [Element](/docs/Element)

This encloses an element in a **Frame** at a particular position. If the `children` argument is a string, it will be automatically wrapped in a [Text](/docs/Text) element. The primary usage of this is in the creation of networks using the [Network](/docs/Network) component. You must provide an `id` argument to reference the node in an [Edge](/docs/Edge) element.

Parameters:
- `id` — a string to be used as the node identifier
- `children` — the element or text to be enclosed in the node box
- `yrad` = `0.1` — the radius of the node box (will adjust to aspect)
- `padding` = `0.1` — the padding of the node box
- `border` = `1` — the border width of the node box
- `rounded` = `0.05` — the radius of the corners of the node box
- `wrap` = `null` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)
- `justify` = `'center'` — the horizontal justification of the text
