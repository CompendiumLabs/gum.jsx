// font shaping

import LineBreaker from 'linebreak'
import opentype from 'opentype.js'
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
// opentype renderer
//

const font_files = {
    sans: 'IBMPlexSans-Thin.ttf',
    mono: 'IBMPlexMono-Thin.ttf',
}

// load font data
const fonts = Object.fromEntries(await Promise.all(
    Object.entries(font_files).map( async ([ name, file ]) => {
        const url = new URL(`./fonts/${file}`, import.meta.url)
        return [ name, await opentype.load(url) ]
    })
))

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

function wrapWidths(objects, maxWidth) {
    // handle null case
    if (maxWidth == null) {
        return {
            rows: [ objects ],
            widths: [ sum(objects.map(o => o.size)) ]
        }
    }

    // return values
    const rows = []
    const widths = []

    // line accumulation
    let buffer = []
    let width = 0

    // iterate over sizes
    for (const { object, size } of objects) {
        const width1 = width + size
        if (buffer.length > 0 && width1 > maxWidth) {
            // start a new line
            rows.push(buffer)
            widths.push(width)
            buffer = [ object ]
            width = size
        } else {
            // append to current line
            buffer.push(object)
            width = width1
        }
    }

    // add any remaining buffer
    if (buffer.length > 0) {
        rows.push(buffer)
        widths.push(width)
    }

    // return rows and widths
    return { rows, widths }
}

function splitWords(text) {
    const breaks = getBreaks(text)
    const words = breaks.slice(1).map((b, i) => text.slice(breaks[i], breaks[i+1]))
    return words
}

function wrapText(text, maxWidth, args) {
    // handle null case
    if (maxWidth == null) {
        return {
            lines: [ [ text ] ],
            widths: [ textSizer(text, args) ]
        }
    }

    // get size of chunks and a single space
    // compress whitespace, since that's what SVG does
    const widthOf = s => textSizer(s, args)
    const chunks = splitWords(text.replace(/\s+/g, ' '))
    const sizes = chunks.map(c => widthOf(c))

    // iterate over breaks
    let width = 0
    let buffer = []
    let lines = []
    let widths = []
    for (let i = 0; i < chunks.length; i++) {
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

//
// glyph expansion
//

function getGlyphPath(font, glyph, pos, size) {
    const data = fonts[font]
    const [ x, y ] = pos
    const path = data.getPath(glyph, x, y, size)
    return path.toSVG()
}

export { textSizer, getBreaks, wrapText, wrapWidths, wrapMultiText, getGlyphPath }
