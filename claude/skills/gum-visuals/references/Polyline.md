# Polyline

*Inherits*: **Pointstring** > **Element**

This will draw a multi-segment line. The **Polygon** element has the same syntax but will connect the first and last point.

Parameters:
- `children` — list of point coordinates (length two or more)

## Example

Prompt: a square in the center of the figure that is missing its top side

Generated code:
```jsx
<Polyline>{[
  [0.3, 0.3],
  [0.3, 0.7],
  [0.7, 0.7],
  [0.7, 0.3],
]}</Polyline>
```
