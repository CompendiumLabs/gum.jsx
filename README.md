<div align="center">
<img src="image/logo.svg" alt="logo" width="500" />
<br/>
</div>

<div align="center">
<img src="image/nexus.svg" alt="nexus" width="250" />
<br/><br/>
</div>

A language for creating visualizations using a React-like JSX dialect that evaluates to SVG. Designed for general graphics, plots, graphs, and network diagrams.

Head to **[compendiumlabs.ai/gum](https://compendiumlabs.ai/gum)** for a live demo and documentation. For Python bindings, see **[gum.py](https://github.com/CompendiumLabs/gum.py)**.

# Installation

```bash
npm install gum-jsx
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

# CLI

You can use the `gum` command to convert `gum.jsx` into SVG text or PNG data. At that point you can either pipe them to a file or even display them directly in the terminal using `chafa`! For the latter you need a terminal that supports images, such as `ghostty`. There are a bunch of code examples in `docs/code/` and `docs/gallery/` to try out.

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

CLI options:

| Option | Description | Default |
|--------|-------------|---------|
| `-s, --size <size>` | Image size in pixels | 500 |
| `-t, --theme <theme>` | Theme: `light` or `dark` | light |
