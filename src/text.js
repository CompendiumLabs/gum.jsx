// font shaping

import LineBreaker from 'linebreak'
import opentype from 'opentype.js'

import { is_string, compress_whitespace } from './utils.js'
import { CONSTANTS as C, DEFAULTS as D } from './defaults.js'

//
// load fonts as arraybuffers
//

function isBrowser() {
    return typeof window != 'undefined'
}

async function getFontPaths() {
    if (isBrowser()) {
        return {
            [C.sans]: new URL('fonts/IBMPlexSans-Variable.ttf', import.meta.url),
            [C.mono]: new URL('fonts/IBMPlexMono-Regular.ttf', import.meta.url),
        }
    } else {
        const path = await import('path')
        const { fileURLToPath } = await import('url')
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        return {
            [C.sans]: path.join(__dirname, 'fonts', 'IBMPlexSans-Variable.ttf'),
            [C.mono]: path.join(__dirname, 'fonts', 'IBMPlexMono-Regular.ttf'),
        }
    }
}

async function loadFont(path) {
    if (isBrowser()) {
        const response = await fetch(path)
        const arrayBuffer = await response.arrayBuffer()
        return opentype.parse(arrayBuffer)
    } else {
        const fs = await import('fs/promises')
        const { buffer} = await fs.readFile(path)
        return opentype.parse(buffer)
    }
}

async function loadFonts() {
    const paths = await getFontPaths()
    return Object.fromEntries(
        await Promise.all(
            Object.entries(paths).map(
                async ([ k, v ]) => [ k, await loadFont(v) ]
            )
        )
    )
}

// load it
const FONTS = await loadFonts()

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

export { getFontPaths, textSizer, getBreaks, splitWords, wrapWidths, wrapText, mergeStrings }
