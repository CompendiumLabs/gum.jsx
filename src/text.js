// font shaping

import LineBreaker from 'linebreak'
import opentype from 'opentype.js'
import { DEFAULTS as D } from './defaults.js'
import { sum } from './utils.js'

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

function splitWords(text, trim = false) {
    const breaks = getBreaks(text)
    const words = breaks.slice(1).map((b, i) => text.slice(breaks[i], breaks[i+1]))
    return trim ? words.map(w => w.trim()) : words
}

function wrapWidths(objects, measure, maxWidth) {
    // handle null case
    if (maxWidth == null) {
        return {
            rows: [ objects ],
            widths: [ sum(objects.map(measure)) ]
        }
    }

    // return values
    const rows = []
    const widths = []

    // line accumulation
    let buffer = []
    let width = 0

    // iterate over sizes
    for (const object of objects) {
        const size = measure(object)
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

// compress whitespace, since that's what SVG does
function wrapText(text, maxWidth, args) {
    const chunks = splitWords(text.replace(/\s+/g, ' '))
    const measure = c => textSizer(c, args)
    return wrapWidths(chunks, measure, maxWidth)
}

function wrapMultiText(text, text_wrap, fargs) {
    const results = text.split('\n').map(t => wrapText(t, text_wrap, fargs))
    const rows = results.map(r => r.rows).flat()
    const widths = results.map(r => r.widths).flat()
    return { rows, widths }
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

export { textSizer, getBreaks, splitWords, wrapWidths, wrapText, wrapMultiText, getGlyphPath }
