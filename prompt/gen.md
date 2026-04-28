# Using CLI commands

To test the output of a particular Gum JSX snippet or file, you can pipe it to the `gum` command. If this command is not available globally, try to install the `gum-jsx` package with Bun (preferred) or NPM.

If you have vision capabilities, seeing an actual image can be useful for see the actual output of the code, either in SVG or PNG format. Even without vision, one can infer properties of the output by reading the SVG output directly.

For one off tests, pipe the code using `echo`. It is recommended that you use single quotes as the outer delimiter, to accommodate code that includes double quotes for component properties (e.g. `justify="left"`).

For more difficult tasks, use a file provide the filename as an argument or `cat` it in. Using a file allows you to view and refine your code repeatedly. If you wish to avoid output redirection to a file, use the `-o` option to write to a file.

In general, it makes a lot of sense to write a draft to a file, view its output, then refine the code until you're satisfied. This way you can start simple and add complexity as needed. When in doubt, write the output file to the same directory as the input file with the same base name but with the appropriate extension.

**Examples:**
```bash
# Generate SVG from a Gum JSX snippet
echo '<Rectangle rounded fill={blue} />' | gum -f svg > test.svg

# Generate PNG from a Gum JSX snippet
echo '<Rectangle rounded fill={blue} />' | gum -f png > test.png

# Generate SVG from a .jsx file
cat test.jsx | gum -f svg > test.svg

# Generate PNG from a .jsx file
cat test.jsx | gum -f png > test.png

# Generate SVG from a .jsx file without redirection
gum test.jsx -o test.svg

# Generate PNG from a .jsx file without redirection
gum test.jsx -o test.png
```

**CLI options:**
- `file`: Gum JSX file to render (reads from stdin if not provided)
- `-t, --theme <theme>`: theme to use (default: light)
- `-b, --background <color>`: background color (default: white)
- `-i, --input <input>`: input format (default: jsx)
- `-f, --format <format>`: output format: svg or png (default: kitty or auto-detected)
- `-o, --output <output>`: output file (default: stdout)
- `-s, --size <size>`: size of the SVG (default: 1000)
- `-w, --width <width>`: width of the PNG (default: auto)
- `-h, --height <height>`: height of the PNG (default: auto)
- `-u, --update`: enable live update display

# Using Gum in TypeScript

There are a couple of ways to use Gum in TypeScript. You can evaluate JSX strings directly, or you can construct Gum components directly. If you want to use Gum components in React, you can use the `react-gum-jsx` package.

## Evaluating JSX strings

The `evaluateGum` function from `gum-jsx/eval` parses a JSX string and returns an `Svg` element tree. Call `.svg()` on the result to get an SVG string.

```typescript
import { evaluateGum } from 'gum-jsx/eval'
import { rasterizeSvg } from 'gum-jsx/render'
import { writeFileSync } from 'fs'

// parse JSX string into element tree, then render to SVG
const tree = evaluateGum('<Rectangle rounded fill={blue} />')
const svg = tree.svg()

// render to PNG buffer
const png = rasterizeSvg(svg, {
    size: tree.size,
    background: 'white',
})
writeFileSync('output.png', png)
```

The `evaluateGum` function accepts options for theme, size, and extra context variables:

```typescript
const tree = evaluateGum(code, {
    theme: 'light',
    size: 500,
})
```

## Using components directly

You can also construct Gum components directly by importing them from `gum-jsx` and calling their constructors. Each component takes a single args object.

```typescript
import { Svg, Rectangle, Circle, HStack, Text, blue, red, white } from 'gum-jsx'

// create elements by calling constructors directly
const rect = new Square({ rounded: true, fill: blue })
const circle = new Circle({ fill: red })
const label = new Text({ children: ['Hello'], fill: white })
const layout = new HStack({ children: [rect, circle, label], spacing: 0.1 })

// wrap in Svg and render
const tree = new Svg({ children: [layout], size: 500 })
const svg = tree.svg()
```

When constructing manually, note that:
- `children` is always passed as an array in the args object
- Constants like `blue`, `red`, `none`, etc. are exported from `gum-jsx`
- Utility functions like `range`, `linspace`, `zip` are also available from `gum-jsx`
- Call `.svg()` on the top-level `Svg` element to get the SVG string output
- The realized size of the SVG is available on the `Svg` element as `size`

## Using in React with `react-gum-jsx`

You can use Gum components directly in React components by importing from the `react-gum-jsx` package. This is useful for creating interactive visualizations in React.

Here's an example of how to use Gum in a React component. It's basically the same as what you would pass to `evaluateGum` but as a default export:

```tsx
import { blue, red } from 'gum-jsx'
import { GUM } from 'react-gum-jsx'
const { Frame, HStack, Square, Circle, Text } = GUM

export default function Demo() {
  return <Frame padding margin rounded>
    <HStack padding>
      <Square fill={blue} />
      <Circle fill={red} />
      <Text>Hello</Text>
    </HStack>
  </Frame>
}
```

To run this in a CLI setting, just pass a file with a default export to the `gum-react` command that comes with the `react-gum-jsx` package. This takes very similar arguments to the regular `gum` command.

If you are in a web setting, you'll need to wrap this export in a `<Gum>` component, which takes roughly the same arguments as `evaluateGum`. This would look like:

```tsx
import { Gum } from 'react-gum-jsx'
<Gum size={[640, 360]}>
  <Demo />
</Gum>
```

If the inner component has an `aspect` it will be embedded inside the given size bounds. If it is aspectless, it will be stretched to fill the given size bounds.
