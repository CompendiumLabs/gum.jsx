// font shaping

import LineBreaker from 'linebreak'
import opentype from 'opentype.js'

import { is_string, compress_whitespace } from './utils.js'
import { CONSTANTS as C, DEFAULTS as D } from './defaults.js'

//
// load fonts as arraybuffers
//

async function fetchFont(path) {
    const response = await fetch(path)
    const arrayBuffer = await response.arrayBuffer()
    return opentype.parse(arrayBuffer)
}

async function loadFont(path) {
    const fs = await import('fs/promises')
    const font = await fs.readFile(path)
    return opentype.parse(font.buffer)
}

async function getFontPaths() {
    if (typeof window != 'undefined') {
        const path_sans = new URL('fonts/IBMPlexSans-Variable.ttf', import.meta.url)
        const path_mono = new URL('fonts/IBMPlexMono-Regular.ttf', import.meta.url)
        return {
            [C.sans]: await fetchFont(path_sans),
            [C.mono]: await fetchFont(path_mono),
        }
    } else {
        const path = await import('path')
        const { fileURLToPath } = await import('url')
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const sans = path.join(__dirname, 'fonts', 'IBMPlexSans-Variable.ttf')
        const mono = path.join(__dirname, 'fonts', 'IBMPlexMono-Regular.ttf')
        return {
            [C.sans]: await loadFont(sans),
            [C.mono]: await loadFont(mono),
        }
    }
}

// load it
const FONTS = await getFontPaths()

//
// create text sizer
//

// TODO: handle font_weight
function textSizer(text, { font_family = C.sans, font_weight = C.normal, calc_size = D.calc_size } = {}) {
    if (text == '\n') return null
    const font = FONTS[font_family]
    const text1 = compress_whitespace(text)
    const width = font.getAdvanceWidth(text1, calc_size)
    return width / calc_size
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

function splitWords(text) {
    const breaks = getBreaks(text)
    const words = breaks.slice(1).map((b, i) => text.slice(breaks[i], breaks[i+1]))
    return words.map(w =>
        w.length > 1 && w.endsWith('\n') ?
        [ w.slice(0, -1), '\n' ] : w
    ).flat()
}

// when measure is null, that means mandatory line break (but zero width)
function wrapWidths(objects, measure, maxWidth) {
    // return values
    const rows = []
    const widths = []

    // line accumulation
    let buffer = []
    let width = 0

    // iterate over sizes
    for (const object of objects) {
        const size = measure(object)
        if (size == null) {
            // mandatory new line
            rows.push(buffer)
            widths.push(width)
            buffer = []
            width = 0
        } else if (maxWidth != null && width + size > maxWidth) {
            // start a new line
            rows.push(buffer)
            widths.push(width)
            buffer = [ object ]
            width = size
        } else {
            // append to current line
            buffer.push(object)
            width = width + size
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

function mergeStrings(items) {
    const lines = []
    let buffer = ''
    for (const item of items) {
        if (is_string(item)) {
            buffer += item
        } else {
            if (buffer.length > 0) {
                lines.push(buffer)
                buffer = ''
            }
            lines.push(item)
        }
    }
    if (buffer.length > 0) {
        lines.push(buffer)
    }
    return lines
}

//
// exports
//

export { textSizer, getBreaks, splitWords, wrapWidths, wrapText, mergeStrings }
