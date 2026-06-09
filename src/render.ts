// Rasterize SVG to PNG via node-canvas

import { createCanvas, registerFont, Image, type ImageData as CanvasImageData } from 'canvas'

import type { Size } from './lib/types'
import { FONT_PATHS } from './fonts/fonts'
import { light, regular, bold } from './lib/const'
import { formatImage, readStdin, type FormatImageArgs } from './lib/term'
import { fitSize } from './eval'

// register bundled fonts so SVG <text> resolves consistently
for (const [ family, path ] of Object.entries(FONT_PATHS)) {
  if (typeof path == 'string') {
    registerFont(path, { family })
  } else {
    registerFont(path.light, { family, weight: String(light) })
    registerFont(path.regular, { family, weight: String(regular) })
    registerFont(path.bold, { family, weight: String(bold) })
  }
}

interface RasterizeBaseArgs {
  size?: Size
  background?: string
}

interface RasterizePngArgs extends RasterizeBaseArgs {
  pixel_data?: false
}

interface RasterizePixelArgs extends RasterizeBaseArgs {
  pixel_data: true
}

type RasterizeArgs = RasterizePngArgs | RasterizePixelArgs

function rasterizeSvg(svg: string | Buffer, args: RasterizePixelArgs): CanvasImageData
function rasterizeSvg(svg: string | Buffer, args?: RasterizePngArgs): Buffer
function rasterizeSvg(svg: string | Buffer, { size, background, pixel_data }: RasterizeArgs = {}): Buffer | CanvasImageData {
  // create image object
  const buf = Buffer.isBuffer(svg) ? svg : Buffer.from(svg)
  const img = new Image()
  img.src = buf

  // get image size
  const imgSize: Size = [ img.width, img.height ]
  const [ outW, outH ] = fitSize(imgSize, size)

  // create canvas
  const canvas = createCanvas(outW, outH)
  const ctx = canvas.getContext('2d')

  // fill background
  if (background != null) {
    ctx.fillStyle = background
    ctx.fillRect(0, 0, outW, outH)
  }

  // draw image to canvas and return the requested raster representation
  ctx.drawImage(img, 0, 0, outW, outH)
  return pixel_data ? ctx.getImageData(0, 0, outW, outH) : canvas.toBuffer('image/png')
}

export { rasterizeSvg, formatImage, readStdin }
export type { RasterizeBaseArgs, RasterizePngArgs, RasterizePixelArgs, RasterizeArgs, FormatImageArgs }
