<div align="center">
<img src="images/logo.svg" alt="logo" width="500" />
<br/>
</div>

<div align="center">
<img src="images/nexus.svg" alt="nexus" width="250" />
<br/><br/>
</div>

<p align="center">
  Gum is a JSX vector graphics language that evaluates to SVG.
  <br/>
  It is designed for plots, diagrams, flow charts, and more.
</p>

<p align="center">
  <a href="https://compendiumlabs.ai/gum/studio">Live Demo</a>
  |
  <a href="https://compendiumlabs.ai/gum/docs">Documentation</a>
  |
  <a href="https://compendiumlabs.ai/gum/docs/gala">Gallery</a>
</p>

## Installation

```bash
bun i gum-jsx
```

This will install the `gum` command and the `gum-jsx` package. Add a `-g` flag to install globally. To download the skill file (which is just a zip), click on the release on the right or use `skills/gum-jsx.skill`.

See [react-gum-jsx](https://github.com/CompendiumLabs/react-gum-jsx) for React bindings. See [gum.py](https://github.com/CompendiumLabs/gum.py) for a Python wrapper.

## Library Usage

Write some `gum.jsx` code:

```jsx
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid margin={[0.2, 0.1]} aspect={2}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
</Plot>
```

Then evaluate it to SVG:

```javascript
import { evaluateGum } from 'gum/eval'
const elem = evaluateGum(jsx)
const svg = elem.svg()
```

Which will produce the following:

<img src="images/plot.svg" alt="sine wave plot" width="750" />

You can also use JavaScript directly:

```javascript
import { Svg, Box, Text, Circle, Plot, SymLine, pi, sin } from 'gum'
const elem = new Plot({
  children: [ new SymLine({ fy: sin, stroke: blue, stroke_width: 2 }) ],
  xlim: [0, 2*pi], ylim: [-1.5, 1.5], grid: true, margin: [0.2, 0.1], aspect: 2,
})
const svg = elem.svg()
```

## Command Line

You can use the `gum` command to convert `gum.jsx` into SVG text or PNG data. You can even just display it directly in the terminal. For the latter you need a terminal that supports images, such as `ghostty` or `kitty`. There are a bunch of code examples in `docs/code/` and `gala/code/` to try out.

Generate an SVG from a `gum.jsx` file:

```bash
gum input.jsx -o output.svg
```

Generate a PNG from a `gum.jsx` file:

```bash
gum input.jsx -o output.png
```

Display a `gum.jsx` file in the terminal:
```bash
gum input.jsx
```

CLI options:

| Option | Description | Default |
|--------|-------------|---------|
| `file` | Gum JSX file to render | stdin |
| `-s, --size <size>` | SVG/viewBox size in pixels | 1000 |
| `-t, --theme <theme>` | Theme: `light` or `dark` | light |
| `-b, --background <color>` | Background color | white |
| `-f, --format <format>` | Format: `json`, `svg`, `png`, `kitty` | auto |
| `-o, --output <output>` | Output file | stdout |
| `-r, --raster-size <size>` | Max rasterized PNG size | auto |
| `-d, --dev` | Live update display | off |

## Math Rendering

The LaTeX pipeline is also available standalone as a lightweight alternative to MathJax/KaTeX for server-side math rendering. The `size` argument is the font size in pixels, so the output is sized naturally to the math (plus optional `padding` in em):

```javascript
import { mathToSvg, mathToPng, mathToKitty } from 'gum/math'
const svg = mathToSvg('\\int_0^\\infty e^{-x^2} dx = \\frac{\\sqrt{\\pi}}{2}', { size: 24 })
const png = mathToPng('e^{i\\pi} + 1 = 0', { size: 32, inline: true, padding: 0.5, background: 'white', scale: 2 })
```

Options: `inline` (text style rather than display style), `size` (font size in px), `padding` (em), `color`, `background`, `theme` (`light`/`dark`), and `scale` (raster scale factor for PNG). There is also `mathToElement`, which returns the `Svg` element itself.

The same is available from the command line with `gum-tex`:

```bash
gum-tex '\sum_{n=1}^\infty \frac{1}{n^2} = \frac{\pi^2}{6}' -o sum.svg
gum-tex -s 32 -t dark -o euler.png < euler.tex
gum-tex 'E = mc^2'   # display in the terminal
```

| Option | Description | Default |
|--------|-------------|---------|
| `tex` | LaTeX source | `--file` or stdin |
| `-i, --inline` | Inline (text) style rather than display style | off |
| `-F, --file <file>` | Read LaTeX source from file | |
| `-s, --size <size>` | Font size in pixels | 24 |
| `-p, --padding <padding>` | Padding around the math in em | 0.25 |
| `-t, --theme <theme>` | Theme: `light` or `dark` | light |
| `-c, --color <color>` | Text color | theme color |
| `-b, --background <color>` | Background color (`none` for transparent) | white (light theme) |
| `-x, --scale <scale>` | Raster scale factor for PNG/kitty output | 1 |
| `-f, --format <format>` | Format: `svg`, `png`, `kitty` | auto |
| `-o, --output <output>` | Output file | stdout |

## Markdown Display

There is also a Markdown-to-terminal renderer that displays fenced `gum` code blocks, image links (`.png`, `.svg`, `.jsx`), and TeX math (`$...$` and `$$...$$`) inline as kitty images, with ANSI styling for the rest:

````markdown
# Sine wave

The function $\sin(x)$ looks like this:

```gum width=600 height=300
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} aspect={2}>
  <SymLine fy={sin} stroke={blue} />
</Plot>
```
````

Display it with `gum-down` (code block options `width=`, `height=`, and `theme=` override the global settings):

```bash
gum-down notes.md -t light -w 800
```

| Option | Description | Default |
|--------|-------------|---------|
| `file` | Markdown file to render | stdin |
| `-t, --theme <theme>` | Theme: `light` or `dark` | dark |
| `-w, --width <pixels>` | Max width for gum blocks (and math) | 1000 (math: 750/600) |
| `-H, --height <pixels>` | Max height for gum blocks (and math) | 500 (math: 75/40) |

Or from JavaScript:

```javascript
import { displayMarkdown } from 'gum/mark'
process.stdout.write(displayMarkdown(markdown, { theme: 'light', width: 800 }))
```
