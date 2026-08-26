# Text Elements

## Text

*Inherits*: **VStack** > **Element**

Displays text and other elements. Note that you will typically not set the font size of the text here, as this will fill the entire space with the provided text. To set the text color, use `color` instead of `fill` or `stroke`.

If `wrap` is specified, the text will be wrapped to the specified width. In either case, single newlines will be respected, though whitespace will be compressed. There are two wrapper elements related to text:

- **TextBox** / **TextFrame** can handle text with a border and background
- **TextStack** can handle multiple lines of text that are passed in as an array

There are two default fonts that are always provided: `sans = 'IBM Plex Sans'` and `mono ='IBM Plex Mono'`. There are three availabe font weights: `light = 300`, `regular = 400`, and `bold = 700`. The default weight is `light`. You can use these global variables anywhere.

Parameters:
- `children` — the text to display
- `wrap` = `null` — the width (in ems) to wrap the text at (if `null`, the text will not be wrapped)
- `spacing` = `0.2` — the spacing between lines of text
- `justify` = `'left'` — the horizontal justification of the text
- `color` = `black` — sets the text color using both stroke and fill (this is the usual way)
- `font-family` = `sans` — the font family (for display and size calculations)
- `font-weight` = `300` — the font weight (for display and size calculations)

**Example**

Prompt: The text "Hello World! You can mix text and other elements together." with a blue square between "and" and "other". Put it in a rounded frame with padding.

Generated code:
```jsx
<TextFrame rounded wrap={10} justify="center">
  Hello World! You can mix text and <Square rounded fill={blue} /> other elements together.
</TextFrame>
```

## TitleFrame

*Inherits*: **Frame** > **Element**

A special type of **Frame** that places a title element in a box centered on the line at the top of the frame. The title element can be either a proper Element or a string, in which case it will be wrapped in a **Text** element.

Parameters:
- `title` — the text or element to use as the title
- `title-size` = `0.1` — the size of the title element
- `adjust` = `true` — whether to adjust the padding and margin to account for the title element
- `border` = `1` — the outer frame border width to use

Subunits:
- `title` — the title element

**Example**

Prompt: Various food emojis are arranged in a spaced out grid and framed with the title "Fruits & Veggies". Each emoji is framed by a rounded square

Generated code:
```jsx
const emoji = [ '🍇', '🥦', '🍔', '🍉', '🍍', '🌽', '🍩', '🥝', '🍟' ]
return <TitleFrame title="Fruits & Veggies" margin padding rounded>
  <Grid rows={3} spacing={0.05}>
    {emoji.map(e =>
      <Frame aspect rounded padding><Text>{e}</Text></Frame>
    )}
  </Grid>
</TitleFrame>
```

## Bullets

*Inherits*: **VStack** > **Group** > **Element**

A bulleted list. Each child becomes an item: strings and **Text** elements are wrapped to the list width minus the indent, with a marker placed in the indent level with the first line. Other elements (say a **Latex** equation) are placed as-is with a marker beside them. A nested `Bullets` child becomes a sub-list, indented without a marker of its own.

All widths are in em, so text in a `Bullets` comes out the same size as a `Text` with the same `wrap`. This makes it fit naturally inside a **Slide**, which sets `wrap` on all of its children.

Parameters:
- `children` — the list items: strings, `Text` elements, other elements, or nested `Bullets`
- `wrap` = `25` — the total width of the list in ems
- `marker` = `'•'` — the marker string or element placed beside each item
- `indent` = `1.5` — the width of the marker column in ems
- `gap` = `0.5` — the vertical space between items in ems
- `spacing` — the total stack spacing fraction; overrides `gap` when given
- `justify` = `'left'` — the horizontal justification of item text
- `font-family`/`font-weight`/`font-style` — font settings for the item text
- `text-*` — additional arguments forwarded to each item's `Text`

**Example**

Prompt: A bulleted list of three points about layout, with a nested sub-list under the second point, all wrapped to 22 ems and framed with padding.

Generated code:
```jsx
<Frame padding rounded>
  <Bullets wrap={22}>
    <Text>Positions and sizes are proportional to the parent</Text>
    <Text>Layout containers arrange their children</Text>
    <Bullets>
      <Text>Stacks place elements along one axis</Text>
      <Text>Grids place elements along two</Text>
    </Bullets>
    <Text>Text is measured with real font metrics</Text>
  </Bullets>
</Frame>
```

## Slide

*Inherits*: **Box** > **Group** > **Element**

Create a presentation slide with a title and some content. A slide is a fixed-aspect canvas (16:9 by default) holding a **TitleFrame** that fills the canvas inside the margin. The content is a `TextStack` of the children: strings, **Text**, **Bullets**, and any other `Element`s are arrayed vertically and the given `wrap` is applied to the text elements.

Text size follows from `wrap`: the content fills the width of the frame, so one em is the content width divided by `wrap`. A child that sets its own `wrap` keeps it, so `<Text wrap={12}>` makes a heading twice the size of the body text. If the content is too tall for the frame it is shrunk to fit the height instead. The `overflow` property on the resulting element gives the ratio of content height to available height, so a value above `1` means the content was shrunk.

Both `margin` and `padding` are given as fractions of the slide height, so they are the same distance in every direction.

Parameters:
- `children` = `[]` — a list of strings or `Element`s to array vertically
- `title` — the slide title, a string or `Element`
- `aspect` = `16/9` — the aspect ratio of the slide canvas
- `wrap` = `25` — the width (in ems) to wrap the text at
- `margin` = `0.05` — the space between the canvas edge and the frame
- `padding` = `0.1` — the space between the frame and the content
- `spacing` = `0.05` — the spacing between content elements
- `justify` = `'left'` — the horizontal justification of the text
- `valign` = `'center'` — the vertical alignment of the content when it does not fill the frame
- `background` — the fill color of the whole canvas
- `border` = `1` — the frame border width
- `border-stroke` = `'#bbb'` — the frame border color
- `rounded` = `0.01` — the frame corner rounding
- `title-size` = `0.1` — the size of the title box relative to the frame height
- `fill` — the fill color of the frame

Subunits:
- `title` — the title element
- `text` — the text elements

**Example**

Prompt: A slide titled "The Art of the Sine Wave" with a short paragraph, a plot of a sine wave, and two bullet points about it.

Generated code:
```jsx
<Slide title="The Art of the Sine Wave">
  <Text>Here's a plot of a sine wave. It has to be the right size to fit in with the text correctly.</Text>
  <Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid fill={lightgray} margin={[0.25, 0.05]} aspect={3}>
    <SymLine fy={sin} stroke={blue} stroke-width={2} />
  </Plot>
  <Bullets>
    <Text>It ranges from low to high</Text>
    <Text>The extra vertical space shows the full curve</Text>
  </Bullets>
</Slide>
```
