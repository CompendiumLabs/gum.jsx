# @gum-jsx/core

The core of [gum.jsx](https://github.com/CompendiumLabs/gum-jsx): the evaluator that turns gum's JSX dialect into SVG, the element library behind it (layout, geometry, text, plots, networks, symbolic curves), and the fonts (IBM Plex) it measures text with. A pure, platform-neutral library with no CLI and no node-only dependencies — it runs the same in a browser and on a server. The batteries-included [`gum-jsx`](https://github.com/CompendiumLabs/gum-jsx) package wraps it together with the add-ons and ships the `gum` command; install that instead if you want the whole stack.

## Installation

```bash
npm install @gum-jsx/core
```

## Usage

`evaluateGum` evaluates a string of gum.jsx and returns the root `Svg` element; `.svg()` serializes it:

```javascript
import { evaluateGum } from '@gum-jsx/core/eval'

const jsx = `
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid margin={[0.2, 0.1]} aspect={2}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
</Plot>
`
const elem = evaluateGum(jsx, { size: 800, theme: 'light' })
const svg = elem.svg()
```

The code runs with every element, constant (`pi`, `blue`, `sans`, …) and utility (`linspace`, `zip`, `random`, …) in scope, so most files are a single JSX expression; a file can also declare things and `return` an element. Options: `size` (a number or `[width, height]`), `theme` (`light` or `dark`), `context` (extra names to bind), `prelude` (code or a context evaluated first, see `evaluatePrelude`), `seed` (for `random`/`uniform`/`normal`/`integer`), `strict` (throw on rendering fallbacks instead of drawing them), `loadFile` (how `loadTable(path)` and `<LoadImage id={path} />` in the code read files), `debug`, plus any `Svg` argument such as `padding`, `unit_size` or `bare`.

The elements are plain classes and can be used from JavaScript directly, with props in `snake_case`:

```javascript
import { Plot, SymLine, pi, sin, blue } from '@gum-jsx/core'

const elem = new Plot({
  children: [ new SymLine({ fy: sin, stroke: blue, stroke_width: 2 }) ],
  xlim: [0, 2*pi], ylim: [-1.5, 1.5], grid: true, margin: [0.2, 0.1], aspect: 2,
})
const svg = elem.svg()
```

The [documentation](https://compendiumlabs.ai/gum/docs) has a page and an example per element; the same pages ship in `@gum-jsx/docs`.

## Fonts

Text is measured against real font metrics, so the faces have to be loaded before anything with text is rendered. In node they are read from disk on first use and nothing more is needed. In a browser, fetch them first — `await loadTextFonts()` for IBM Plex (the faces core registers), or `await loadFonts()` for everything registered, including an add-on's — otherwise rendering throws `FontNotLoadedError`. `registerFont(name, path, face)` adds a face of your own, and `FONT_DATA` (in `@gum-jsx/core/fonts`) holds the fetched bytes for handing to `FontFace` so the page can draw the same glyphs the layout measured. Emoji are measured with a fixed advance and left to the host's emoji font.

## Extending

Core keeps two registries in `@gum-jsx/core/registry` — `ELEMS`, the element constructors by JSX tag name, and `CONTEXT`, everything bound as a global of evaluated code. An add-on calls `registerElements` (and `registerContext` for constants or functions) on import, so a host that imports only core gets only core's names, and importing the add-on is what makes its tags available; `@gum-jsx/math` does exactly this for `<Latex>` and the KaTeX faces. Internals are reachable through the subpath exports `@gum-jsx/core/lib/*` (`Context`, `types`, `theme`, `strict`, `utils`, …), `@gum-jsx/core/elems/*` (the element modules), and `@gum-jsx/core/fonts` (the font registry) — that is the surface add-ons are written against.

Strict mode (`strict: true`, `setStrict` in `@gum-jsx/core/lib/strict`) turns the permissive fallbacks — unparseable input, unknown tags or commands, glyphs missing from a face — into thrown `StrictError`s, which is how the `gum-jsx` test suite renders every example.
