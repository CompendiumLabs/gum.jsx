// font shaping

import LineBreaker from 'linebreak'
import { DEFAULTS as D } from './defaults.js'

//
// canvas text sizer
//

// canvas text sizer
function canvasTextSizer(ctx, text, {
    family = D.family_sans, weight = D.font_weight, size = D.calc_size, actual = false
} = {}) {
    ctx.font = `${weight} ${size}px ${family}`
    const met = ctx.measureText(text)
    if (actual) {
        const { actualBoundingBoxLeft, actualBoundingBoxDescent, actualBoundingBoxRight, actualBoundingBoxAscent } = met
        const [ width, height ] = [ actualBoundingBoxRight - actualBoundingBoxLeft, actualBoundingBoxAscent - actualBoundingBoxDescent ]
        return width / height
    } else {
        const { width } = met
        return width / size
    }
}

// get a canvas (browser or node)
let canvas = null
if (typeof window == 'undefined') {
    const { createCanvas, registerFont } = await import('canvas')
    registerFont('./src/fonts/IBMPlexSans-Regular.ttf', { family: D.family_sans })
    registerFont('./src/fonts/IBMPlexMono-Regular.ttf', { family: D.family_mono })
    const [ width, height ] = [ D.svg_size, D.svg_size ]
    canvas = createCanvas(width, height)
} else {
    canvas = document.createElement('canvas')
}

// try for browser environment
let textSizer = null
try {
    const ctx = canvas.getContext('2d')
    textSizer = function(text, args) {
        return canvasTextSizer(ctx, text, args)
    }
} catch (error) {
    console.log(error)
}

//
// text wrapping
//

function getBreaks(text) {
    const breaker = new LineBreaker(text)
    const breaks = [0]
    for (let bk; (bk = breaker.nextBreak()); ) {
        breaks.push(bk.position)
    }
    if (breaks[breaks.length - 1] !== text.length) {
        breaks.push(text.length)
    }
    return breaks
}

function wrapText(text, aspect, args) {
    // accurate, kerning-aware width
    const widthOf = s => textSizer(s, args)

    // compress whitespace, since that's what SVG does
    text = text.replace(/\s+/g, ' ')
    const breaks = getBreaks(text)

    // iterate over breaks
    let i = 0
    const lines = []
    while (i < breaks.length - 1) {
      // start after last break
      const start = breaks[i]
      let lo = i + 1
      let hi = breaks.length - 1
      let best = lo

      // binary search for best break
      while (lo <= hi) {
        // get candidate line width
        const mid = (lo + hi) >> 1
        const pos = breaks[mid]
        const slice = text.slice(start, pos).trimEnd()
        const w = widthOf(slice)

        // check if it fits
        if (w <= aspect) {
          best = mid
          lo = mid + 1
        } else {
          hi = mid - 1
        }
      }

      // get trimmed line
      const pos = breaks[best]
      const line = text.slice(start, pos).trimEnd()

      // store line result
      lines.push(line)
      i = best
    }

    // return lines
    return lines
}

export { textSizer, getBreaks, wrapText }
