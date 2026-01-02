# Node

*Inherits*: [Frame](/docs/Frame) > [Element](/docs/Element)

This encloses an element in a **Frame** at a particular position. To automatically wrap the contents in a **Text** element, use [TextNode](/docs/TextNode) instead. The primary usage of this is in the creation of networks using the [Network](/docs/Network) component. You must provide a `label` argument to reference this in an [Edge](/docs/Edge) element.

Parameters:
- `label` — a string or **Element** to be used as the label
- `yrad` = `0.1` — the radius of the node box (will adjust to aspect)
- `padding` = `0.1` — the padding of the node box
- `border` = `1` — the border width of the node box
- `rounded` = `0.05` — the radius of the corners of the node box
