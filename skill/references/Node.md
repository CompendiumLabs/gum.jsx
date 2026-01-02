# Node

*Inherits*: **Frame** > **Element**

This encloses an element in a **Frame** at a particular position. To automatically wrap the contents in a **Text** element, use **TextNode** instead. The primary usage of this is in the creation of networks using the **Network** component. You must provide a `label` argument to reference this in an **Edge** element.

Parameters:
- `label` — a string or **Element** to be used as the label
- `yrad` = `0.1` — the radius of the node box (will adjust to aspect)
- `padding` = `0.1` — the padding of the node box
- `border` = `1` — the border width of the node box
- `rounded` = `0.05` — the radius of the corners of the node box

## Example

Prompt: Two boxes with text in them that have black borders and gray interiors. The box in the upper left says "hello" and the box in the lower right says "world!".

Generated code:
```jsx
<Network node-fill={gray}>
  <TextNode label="hello" pos={[0.25, 0.25]}>Hello</TextNode>
  <TextNode label="world" pos={[0.75, 0.75]}>World!</TextNode>
  <Edge node1="hello" node2="world" />
</Network>
```
