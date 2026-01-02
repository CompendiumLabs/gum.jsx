# Latex

*Inherits*: **Text** > **Element**

Creates a new `Math` math element from LaTeX source. Uses `MathJax` when available to render in SVG and calculate aspect ratio. As seen in the example, you will probably need to wrap the LaTeX in `{"..."}` to prevent syntax errors.

Parameters:
- `offset` — the position of the center of the element
- `scale` — the proportional size of the element

## Example

Prompt: There are two latex equations framed by rounded borders arranged vertically. The top one shows a Gaussian integral and the bottom one shows a trigonometric identity. They are framed by a square with the title "Facts".

Generated code:
```jsx
<VStack spacing>
  <TextFrame><Equation>{"\\int_0^{\\infty} \\exp(-x^2) dx = \\sqrt{\\pi}"}</Equation></TextFrame>
  <TextFrame><Equation>{"\\sin^2(\\theta) + \\cos^2(\\theta) = 1"}</Equation></TextFrame>
</VStack>
```
