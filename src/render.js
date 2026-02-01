// Parse markdown and extract gum.jsx code blocks

import { Resvg } from '@resvg/resvg-js'
import { CONSTANTS as C } from './defaults.js'
import { FONT_PATHS, FONT_DATA } from './fonts.js'
import { is_browser } from './utils.js'

// differs between browser WASM and node
const fontArgs = is_browser() ?
  { fontBuffers: [FONT_DATA.sans, FONT_DATA.mono] } :
  { fontFiles: [FONT_PATHS.sans, FONT_PATHS.mono] }

// store font arguments for resvg conversion
const font = {
  ...fontArgs,
  loadSystemFonts: false,
  defaultFontFamily: C.sans,
  sansSerifFamily: C.sans,
  monospaceFamily: C.mono,
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
function rasterizeSvg(svg, opts = {}) {
  let { size, width, height } = opts

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
  const resvg = new Resvg(svg, { fitTo, font })
  return resvg.render().asPng()
}

function formatImage(pngBuffer, { imageId = null, chunkSize = 4096 } = {}) {
  const idParam = imageId != null ? `,i=${imageId}` : ''
  const base64 = pngBuffer.toString('base64')

  let result = ''
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize)
    const isFirst = i === 0
    const isLast = i + chunkSize >= base64.length
    const control = isFirst
      ? `f=100,a=T${idParam},q=1,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`

    result += `\x1b_G${control};${chunk}\x1b\\`
  }

  return result + '\n'
}

export { rasterizeSvg, formatImage }
