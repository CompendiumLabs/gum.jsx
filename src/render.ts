// Parse markdown and extract gum.jsx code blocks

import { Resvg } from '@resvg/resvg-js'

import type { Size } from './lib/types'
import { sans, mono } from './lib/const'
import { is_browser } from './lib/utils'
import { FONT_PATHS, FONT_DATA } from './fonts/fonts'

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

interface FitToWidth {
  mode: 'width'
  value: number
}

interface FitToHeight {
  mode: 'height'
  value: number
}

interface FitToOriginal {
  mode: 'original'
}

type FitTo = FitToWidth | FitToHeight | FitToOriginal

interface RasterizeArgs {
  size?: Size
  width?: number
  height?: number
  background?: string
}

// build fitTo object from width/height options
function buildFitTo(width?: number, height?: number): FitTo {
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
function rasterizeSvg(svg: string | Buffer, { size, width, height, background }: RasterizeArgs = {}): Buffer {
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

// kitty image protocol
function formatImage(pngBuffer: Buffer, { imageId = null as number | null, chunkSize = 4096 } = {}): string {
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

  return result
}

export { rasterizeSvg, formatImage }
export type { RasterizeArgs }
