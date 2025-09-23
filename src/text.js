// font shaping

import LineBreaker from 'linebreak'
import { DEFAULTS as D } from './defaults.js'

//
// canvas text sizer
//

// canvas text sizer
function canvas_text_sizer(ctx, text, {
    family = D.family_sans, weight = D.font_weight, size = D.calc_size, actual = false
} = {}) {
    ctx.font = `${weight} ${size}px ${family}`
    const met = ctx.measureText(text)
    return actual ? [
        -met.actualBoundingBoxLeft,
        -met.actualBoundingBoxDescent,
        met.actualBoundingBoxRight,
        met.actualBoundingBoxAscent
    ] : [
        0, 0, met.width, size
    ]
}

// get a canvas (browser or node)
let canvas = null
if (typeof window == 'undefined') {
    const { createCanvas, registerFont } = await import('canvas')
    registerFont('./src/fonts/IBMPlexSans-Regular.ttf', { family: D.family_sans })
    registerFont('./src/fonts/IBMPlexMono-Regular.ttf', { family: D.family_mono })
    const [ width, height ] = D.size_base
    canvas = createCanvas(width, height)
} else {
    canvas = document.createElement('canvas')
}

// try for browser environment
let textSizer = null
try {
    const ctx = canvas.getContext('2d')
    textSizer = function(text, args) {
        return canvas_text_sizer(ctx, text, args)
    }
} catch (error) {
    console.log(error)
}

//
// text wrapping
//

function getBreaks(text) {
    const breaker = new LineBreaker(text);
    const breaks = [0];
    for (let bk; (bk = breaker.nextBreak()); ) {
        breaks.push(bk.position);
    }
    if (breaks[breaks.length - 1] !== text.length) {
        breaks.push(text.length);
    }
    return breaks;
}

function wrapText(text, aspect, args) {
    // accurate, kerning-aware width
    function widthOf(s) {
        const [x, y, width, height] = textSizer(s, args);
        return width;
    }

    // collect legal break positions
    const maxWidth = aspect * D.calc_size;
    const breaks = getBreaks(text);

    // iterate over breaks
    let i = 0;
    const lines = [];
    while (i < breaks.length - 1) {
      const start = breaks[i];
      let lo = i + 1;
      let hi = breaks.length - 1;
      let best = lo;

      // binary search for best break
      while (lo <= hi) {
        const mid = (lo + hi) >> 1;
        const slice = text.slice(start, breaks[mid]);
        const w = widthOf(slice);
        if (w <= maxWidth) {
          best = mid;
          lo = mid + 1;
        } else {
          hi = mid - 1;
        }
      }

      // get line and add to lines
      const line = text.slice(start, breaks[best]).trimEnd();
      lines.push(line);
      i = best;
    }

    // return lines
    return lines;
}

export { textSizer, getBreaks, wrapText }
