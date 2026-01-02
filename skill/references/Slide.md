# Slide

*Inherits*: **TitleFrame** > **Frame** > **Group** > **Element**

Create a presentation slide with a title and some content. This stacks various `Text` elements and other `Element`s vertically. It will automatically apply the specified `wrap` value to the text elements. It defaults to using a `TitleFrame` for the title and a light gray rounded border.

Parameters:
- `children` = `[]` — a list of strings or `Element`s to array vertically
- `wrap` = `25` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)

Subunits:
- `title` — the title element
- `text` — the text elements

## Example

Prompt: A slide with a title, a plot of a sine wave, and some text describing the plot. Let the title be "The Art of the Sine Wave".

Generated code:
```jsx
<Slide title="The Art of the Sine Wave">
  <Text>Here's a plot of a sine wave below. It has to be the right size to fit in with the figure correctly.</Text>
  <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} fill grid margin={[0.25, 0.05]}>
    <SymLine fy={sin} stroke={blue} stroke-width={2} />
  </Plot>
  <Text>It ranges from low to high and has some extra vertical space to allow us to see the full curve.</Text>
</Slide>
```
