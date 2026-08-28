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

This installs the batteries-included `gum-jsx` package: the `gum`, `gum-tex`, and `gum-mark` commands plus everything below. Add a `-g` flag to install globally. The pieces are also published separately as pure libraries: `@gum-jsx/core` (this repo: the JSX → SVG evaluator and elements, browser-safe), `@gum-jsx/math` (LaTeX), `@gum-jsx/node` (PNG rasterizing and terminal output), `@gum-jsx/mark` (Markdown to terminal), and `@gum-jsx/docs` (the documentation and gallery examples, plus the Claude skill built from them: `skills/gum-jsx.skill`).

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
import { evaluateGum } from 'gum-jsx/eval'   // or '@gum-jsx/core/eval'
const elem = evaluateGum(jsx)
const svg = elem.svg()
```

Which will produce the following:

<img src="images/plot.svg" alt="sine wave plot" width="750" />

You can also use JavaScript directly:

```javascript
import { Svg, Box, Text, Circle, Plot, SymLine, pi, sin } from 'gum-jsx'   // or '@gum-jsx/core'
const elem = new Plot({
  children: [ new SymLine({ fy: sin, stroke: blue, stroke_width: 2 }) ],
  xlim: [0, 2*pi], ylim: [-1.5, 1.5], grid: true, margin: [0.2, 0.1], aspect: 2,
})
const svg = elem.svg()
```

## Command Line

You can use the `gum` command to convert `gum.jsx` into SVG text or PNG data. You can even just display it directly in the terminal. For the latter you need a terminal that supports images, such as `ghostty` or `kitty`. There are a bunch of code examples in `docs/code/` and `gala/code/` of `@gum-jsx/docs` to try out.

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
| `--strict` | Throw on rendering fallbacks instead of drawing them | off |
| `--seed <seed>` | Seed for `random`/`uniform`/`normal`/`integer` | 42 |

## Math Rendering

LaTeX math (`<Latex>`, `<Tex>`, and the standalone `mathToSvg`/`mathToPng` and `gum-tex` CLI) is provided by the [`@gum-jsx/math`](https://www.npmjs.com/package/@gum-jsx/math) package. Importing it registers the math elements, so `<Latex>` works in evaluated code; the `gum` command picks it up automatically when it is installed.

## Markdown Display

The Markdown-to-terminal renderer (`displayMarkdown` and the `gum-mark` command), which shows fenced `gum` blocks, images, and TeX math inline as kitty images, is the [`@gum-jsx/mark`](https://www.npmjs.com/package/@gum-jsx/mark) package.

