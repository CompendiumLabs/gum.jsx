// Standalone LaTeX → SVG/PNG rendering
//
// A lightweight alternative to MathJax/KaTeX for server-side math rendering.
// The TeX string is parsed (with katex's parser) into gum.jsx math elements
// and laid out in em units; the resulting Svg is sized from the font size.

import { Svg } from './elems/core'
import { Box } from './elems/layout'
import { Latex } from './elems/math'
import { none } from './lib/const'
import { setTheme, type ThemeName } from './lib/theme'
import { rasterizeSvg, formatImage } from './render'
import type { FormatImageArgs } from './lib/term'
import type { Size } from './lib/types'

//
// types
//

interface MathArgs {
  inline?: boolean       // text style (inline) rather than display style
  size?: number          // font size in pixels
  padding?: number       // padding around the math in em
  color?: string         // text color (defaults to theme color)
  background?: string    // background color (default: transparent)
  theme?: ThemeName      // light or dark
  strut?: boolean        // enforce a minimum line box around the axis
  [key: string]: any     // other attributes forwarded to Latex
}

interface MathPngArgs extends MathArgs {
  scale?: number         // raster scale factor (pixels per svg pixel)
}

interface MathKittyArgs extends MathPngArgs, FormatImageArgs {}

const DEFAULT_SIZE = 24

//
// element construction
//

// build an Svg element whose dimensions are the natural size of the math at the
// given font size: the viewBox is the math box (in em units scaled by size), so
// glyphs render at exactly `size` pixels per em
function mathToElement(tex: string, args: MathArgs = {}): Svg {
  const { inline, size = DEFAULT_SIZE, padding = 0, color, background, theme = 'light', strut = true, ...attr } = args

  // set theme for color defaults
  setTheme(theme)

  // parse and lay out the math
  const color_attr = color != null ? { color } : {}
  const latex = new Latex({ children: tex, inline, strut, ...color_attr, ...attr })

  // natural math box in em units
  const { advance, vrange: [ ylo, yhi ], hrange } = latex.math
  const [ xlo, xhi ] = hrange ?? [ 0, advance ]
  const width = Math.max(xhi - xlo, 1e-6)
  const height = Math.max(yhi - ylo, 1e-6)

  // pad and optionally fill background (padding is in em, so convert to fractions of the math box)
  const boxed = padding > 0 || background != null
  const child = boxed ? new Box({
    children: [ latex ],
    padding: [ padding / width, padding / height, padding / width, padding / height ],
    fill: background,
    stroke: none,
    adjust: false,
  }) : latex

  // size svg to the math box
  const outer: Size = [ size * (width + 2 * padding), size * (height + 2 * padding) ]
  return new Svg({ children: [ child ], size: outer })
}

//
// output formats
//

function mathToSvg(tex: string, args: MathArgs = {}): string {
  const elem = mathToElement(tex, args)
  return elem.svg()
}

function mathToPng(tex: string, args: MathPngArgs = {}): Buffer {
  const { scale = 1, ...margs } = args
  const elem = mathToElement(tex, margs)
  const [ w, h ] = elem.size
  const svg = elem.svg()
  return rasterizeSvg(svg, { size: [ Math.round(scale * w), Math.round(scale * h) ] })
}

function mathToKitty(tex: string, args: MathKittyArgs = {}): string {
  const { imageId, placementId, chunkSize, columns, rows, cursorMovement, ...pargs } = args
  const png = mathToPng(tex, pargs)
  return formatImage(png, { imageId, placementId, chunkSize, columns, rows, cursorMovement })
}

//
// exports
//

export { mathToElement, mathToSvg, mathToPng, mathToKitty }
export type { MathArgs, MathPngArgs, MathKittyArgs }
