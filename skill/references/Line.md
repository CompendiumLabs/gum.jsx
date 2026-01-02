# Line

*Inherits*: **Element**

The `Line` element is a basic geometric element that draws a line between two points. There are specialized variants for vertical and horizontal lines called **VLine** and **HLine**, which allow you to specify the position of the line (`loc`) and the range of the line (`lim`). See **UnitLine** for more details.

Parameters:
- `pos1` — the coordinate of the first point
- `pos2` — the coordinate of the second point

## Example

Prompt: draw a line from the top left to the bottom right of the frame

Generated code:
```jsx
<Frame>
  <Line pos1={[0, 0]} pos2={[1, 1]} />
</Frame>
```
