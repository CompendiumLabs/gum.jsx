# Using CLI commands

To test the output of a particular `gum.jsx` snippet or file, you can pipe it to the `gum` command, which is assumed to be installed globally. If you have vision capabilities, this can be useful for see the actual output of the code, either in SVG or PNG format. Even without vision, one can infer properties of the output by reading the SVG output directly.

For one off tests, pipe the code using `echo`. It is recommended that you use single quotes as the outer delimiter, to accommodate code that includes double quotes for component properties (e.g. `justify="left"`).

For more difficult tasks, use a file and `cat` it in. Using a file allows you to view and refine your code repeatedly. If you wish to avoid output redirection to a file, use the `-o` option to write to a file.

In general, it makes a lot of sense to write a draft to a file, view its output, then refine the code until you're satisfied. This way you can start simple and add complexity as needed.

**Examples:**
```bash
# Generate SVG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum -f svg > output.svg

# Generate PNG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum -f png > output.png

# Generate SVG from a .jsx file
cat test.jsx | gum -f svg > output.svg

# Generate PNG from a .jsx file
cat test.jsx | gum -f png > output.png

# Generate SVG from a .jsx file without redirection
gum test.jsx -o output.svg

# Generate PNG from a .jsx file without redirection
gum test.jsx -o output.png
```

**CLI options:**
- `file`: gum.jsx file to render (reads from stdin if not provided)
- `-t, --theme <theme>`: theme to use (default: light)
- `-b, --background <color>`: background color (default: white)
- `-i, --input <input>`: input format (default: jsx)
- `-f, --format <format>`: output format: svg or png (default: kitty or auto-detected)
- `-o, --output <output>`: output file (default: stdout)
- `-s, --size <size>`: size of the SVG (default: 1000)
- `-w, --width <width>`: width of the PNG (default: auto)
- `-h, --height <height>`: height of the PNG (default: auto)
- `-u, --update`: enable live update display

# Using in TypeScript

You can use gum.jsx directly in TypeScript/JavaScript code by importing from the `gum-jsx` package. This is useful for programmatic generation, integration into other tools, or when you want to avoid the CLI.

## Evaluating JSX strings

The `evaluateGum` function from `gum-jsx/eval` parses a JSX string and returns an `Svg` element tree. Call `.svg()` on the result to get an SVG string.

```typescript
import { evaluateGum } from 'gum-jsx/eval'
import { rasterizeSvg } from 'gum-jsx/render'

// parse JSX string into element tree, then render to SVG
const tree = evaluateGum('<Rectangle rounded fill={blue} />')
const svg = tree.svg()

// render to PNG buffer
const png = rasterizeSvg(svg)
```

The `evaluateGum` function accepts options for theme, size, and extra context variables:

```typescript
const tree = evaluateGum(code, {
    theme: 'light',     // 'light' or 'dark'
    size: 500,          // SVG size (or [width, height])
    context: { data },  // extra variables available in the JSX code
})
```

## Using components directly

You can also construct components directly by importing them from `gum-jsx` and calling their constructors. Each component takes a single args object.

```typescript
import { Svg, Rectangle, Circle, HStack, Text, blue, red, white } from 'gum-jsx'

// create elements by calling constructors directly
const rect = new Rectangle({ rounded: true, fill: blue })
const circle = new Circle({ fill: red })
const label = new Text({ children: 'Hello', fill: white })

// compose into a layout
const layout = new HStack({ children: [rect, circle, label] })

// wrap in Svg and render
const tree = new Svg({ children: [layout], size: 500 })
const svg = tree.svg()
```

When constructing manually, note that:
- `children` is always passed as an array in the args object
- Constants like `blue`, `red`, `none`, etc. are exported from `gum-jsx`
- Utility functions like `range`, `linspace`, `zip` are also available from `gum-jsx`
- Call `.svg()` on the top-level `Svg` element to get the SVG string output

## Rendering to PNG

Use `rasterizeSvg` from `gum-jsx/render` to convert an SVG string to a PNG buffer:

```typescript
import { rasterizeSvg } from 'gum-jsx/render'
import { writeFileSync } from 'fs'

const png = rasterizeSvg(svg, {
    width: 800,       // output width in pixels
    height: 600,      // output height in pixels
    background: '#ffffff',
})

writeFileSync('output.png', png)
```
