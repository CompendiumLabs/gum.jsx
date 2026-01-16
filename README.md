<div align="center">
<img src="src/image/logo.svg" alt="logo" width="500" />
</div>

<div align="center">
<img src="src/image/nexus.svg" alt="nexus" width="250" />
</div>

A language for creating visualizations using a React-like JSX dialect that evaluates to SVG. Designed for general graphics, plots, graphs, and network diagrams.

Head to **[compendiumlabs.ai/gum](https://compendiumlabs.ai/gum)** for a live demo and documentation.

# Installation

```bash
npm install gum
```

# Usage

Write some `gum.jsx` code:

```jsx
<Plot xlim={[0, 2*pi]} ylim={[-1, 1]} grid margin={0.2} aspect={2}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
</Plot>
```

Then evaluate it to SVG:

```javascript
import { evaluateGum } from 'gum/eval'
const elem = evaluateGum(jsx)
const svg = elem.svg()
```

You can also use JavaScript directly:

```javascript
import { Svg, Box, Text, Circle, Plot, SymLine, pi, sin } from 'gum'
const elem = new Plot({
  children: new SymLine({ fy: sin, stroke: blue, stroke_width: 2 }),
  xlim: [0, 2*pi], ylim: [-1, 1], grid: true, margin: 0.2, aspect: 2,
})
const svg = elem.svg()
```

# Command Line

You can use the `gum` command to generate SVGs, PNGs. You can even display them in the terminal using `chafa`!

Generate an SVG from a `gum.jsx` file:

```bash
cat input.jsx | npx gum > output.svg
```

Generate a PNG from a `gum.jsx` file:

```bash
cat input.jsx | npx gum -f png > output.png
```

Display a `gum.jsx` file with `chafa`:
```bash
cat input.jsx | npx gum | chafa -s 75 -
```

There are a bunch of code examples in `docs/code/` and `docs/gallery/` to try out.

CLI options:

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --size <size>` | Image size in pixels | 500 |
| `-f, --format <format>` | Output format: `svg` or `png` | svg |
| `-t, --theme <theme>` | Theme: `light` or `dark` | light |
| `-b, --background <color>` | Background color | null |
