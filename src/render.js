// Parse markdown and extract gum.jsx code blocks

import { Resvg } from '@resvg/resvg-js'

import { sans, mono } from './defaults.js'
import { is_browser } from './lib/utils.js'
import { FONT_PATHS, FONT_DATA } from './fonts.js'

// differs between browser WASM and node
const fontArgs = is_browser() ?
  { fontBuffers: [FONT_DATA.sans, FONT_DATA.mono] } :
  { fontFiles: [FONT_PATHS.sans, FONT_PATHS.mono] }

// store font arguments for resvg conversion
const font = {
  ...fontArgs,
  loadSystemFonts: false,
  defaultFontFamily: sans,
  sansSerifFamily: sans,
  monospaceFamily: mono,
}

// build fitTo object from width/height options
function buildFitTo(width, height) {
  if (height != null && width != null) {
    return { mode: 'width', value: width } // prefer width when both specified
  } else if (height != null) {
    return { mode: 'height', value: height }
  } else if (width != null) {
    return { mode: 'width', value: width }
  }
  return { mode: 'original' }
}

// rasterize SVG buffer/string to PNG
function rasterizeSvg(svg, { size, width, height, background } = {}) {
  // scale down intrinsic height
  if (size != null && width != null && height != null) {
    const [width0, height0] = size
    const scaleW = width / width0
    const scaleH = height / height0
    if (scaleW < scaleH) height = undefined
    else width = undefined
  }

  // pass to resvg
  const fitTo = buildFitTo(width, height)
  const resvg = new Resvg(svg, { fitTo, font, background })
  return resvg.render().asPng()
}

export { rasterizeSvg }
