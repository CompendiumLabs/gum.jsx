// font shaping

import LineBreaker from 'linebreak'
import { DEFAULTS as D } from './defaults.js'

//
// canvas text sizer
//

// canvas text sizer
function canvasTextSizer(ctx, text, {
    font_family = D.font.family_sans, font_weight = D.font.weight, calc_size = D.font.calc_size
} = {}) {
    ctx.font = `${font_weight} ${calc_size}px ${font_family}`
    const { width } = ctx.measureText(text)
    return width / calc_size
}

// get a canvas (browser or node)
let canvas = null
if (typeof window == 'undefined') {
    const { createCanvas, registerFont } = await import('canvas')
    registerFont('./src/fonts/IBMPlexSans-Thin.ttf', { family: 'IBM Plex Sans' })
    registerFont('./src/fonts/IBMPlexMono-Thin.ttf', { family: 'IBM Plex Mono' })
    const [ width, height ] = [ D.svg.size, D.svg.size ]
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
// mathjax renderer
//

try {
    await import('mathjax/es5/tex-svg.js')
} catch (error) {
    // console.log(error)
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

function wrapText(text, maxWidth, args) {
    // handle null case
    if (maxWidth == null) {
        return {
            lines: [ [ text ] ],
            widths: [ textSizer(text, args) ]
        }
    }

    // accurate, kerning-aware width
    const widthOf = s => textSizer(s, args)

    // compress whitespace, since that's what SVG does
    text = text.replace(/\s+/g, ' ')
    const breaks = getBreaks(text)

    // get size of chunks and a single space
    const chunks = breaks.slice(1).map((b, i) => text.slice(breaks[i], breaks[i+1]))
    const sizes = chunks.map(c => widthOf(c))

    // iterate over breaks
    let width = 0
    let buffer = []
    let lines = []
    let widths = []
    for (let i = 0; i < breaks.length - 1; i++) {
        const chunk = chunks[i]
        const size = sizes[i]
        const width1 = width + size
        if (buffer.length > 0 && width1 > maxWidth) {
            lines.push(buffer)
            widths.push(width)
            buffer = [ chunk ]
            width = size
        } else {
            buffer.push(chunk)
            width = width1
        }
    }

    // add any remaining buffer
    if (buffer.length > 0) {
        lines.push(buffer)
        widths.push(width)
    }

    // return lines
    return { lines, widths }
}

function wrapMultiText(text, text_wrap, fargs) {
    const results = text.split('\n').map(t => wrapText(t, text_wrap, fargs))
    const lines = results.map(r => r.lines).flat()
    const widths = results.map(r => r.widths).flat()
    return { lines, widths }
}

export { textSizer, getBreaks, wrapText, wrapMultiText }
