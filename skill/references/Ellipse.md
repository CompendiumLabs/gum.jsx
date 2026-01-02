# Ellipse

*Inherits*: **Element**

This makes an ellipse. Without any arguments it will inscribe its allocated space. Use **Circle** for a circle with a unit aspect.

## Example

Prompt: two ellipses, one wider and one taller

Generated code:
```jsx
<Group>
  <Ellipse pos={[0.3, 0.2]} rad={[0.2, 0.1]} />
  <Ellipse pos={[0.6, 0.6]} rad={[0.2, 0.25]} />
</Group>
```
