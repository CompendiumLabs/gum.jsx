// font shaping

import EMOJI_REGEX from 'emojibase-regex'
import LineBreaker from 'linebreak'

import { DEFAULTS as D, sans, moji } from './const.js'
import { is_string, compress_whitespace, sum } from './utils.js'
import { FONTS } from '../fonts/fonts.js'

//
// create text sizer
//

function is_emoji(text: string): boolean {
    return EMOJI_REGEX.test(text)
}

function arrayEquals(a: number[], b: number[]): boolean {
    return a.length == b.length && a.every((x, i) => x == b[i])
}

function splitSegments(text: string): string[] {
    const segmenter = new Intl.Segmenter()
    const segments = segmenter.segment(text)
    return [...segments].map(s => s.segment)
}

function emojiSizer(text: string): number {
    // get emoji font
    const font = FONTS[moji]
    if (font == null) return 1.25

    // get glyphs
    const { unitsPerEm } = font
    const glyphs = font.stringToGlyphs(text)

    // handle simple case
    if (glyphs.length == 1) {
        const { advanceWidth = 0 } = glyphs[0]
        return advanceWidth / unitsPerEm
    }

    // find substitution
    const subs = font.substitution.getFeature('ccmp')
    const indices = glyphs.map(g => g.index)
    const sub = subs.find(s => arrayEquals(s.sub, indices))

    // if no substitution found, return sum of glyph widths
    if (sub == null) {
        const width = sum(glyphs.map(g => g.advanceWidth))
        return width / unitsPerEm
    }

    // get glyph advance
    const { advanceWidth = 0 } = font.glyphs.get(sub.by)
    return advanceWidth / unitsPerEm
}

type TextSizerArgs = {
    font_family?: string
    calc_size?: number
}

// TODO: handle font_weight
function textSizer0(text: string, { font_family = sans, calc_size = D.calc_size }: TextSizerArgs = {}): number {
    if (is_emoji(text)) return emojiSizer(text)
    const font = FONTS[font_family]
    const width = font.getAdvanceWidth(text, calc_size)
    return width / calc_size
}

function textSizer(text: string, args: TextSizerArgs = {}): number | undefined {
    if (text == '\n') return
    const text1 = compress_whitespace(text)
    const segments = splitSegments(text1)
    const widths = segments.map(s => textSizer0(s, args))
    return sum(widths)
}

//
// text wrapping
//

function getBreaks(text: string): number[] {
    const breaker = new LineBreaker(text)
    const breaks = [0]
    for (let bk: any; (bk = breaker.nextBreak()); ) {
        breaks.push(bk.position)
    }
    if (breaks[breaks.length - 1] !== text.length) {
        breaks.push(text.length)
    }
    return breaks
}

function splitWords(text: string): string[] {
    const breaks = getBreaks(text)
    const words = breaks.slice(1).map((_b, i) => text.slice(breaks[i], breaks[i+1]))
    return words.map(w =>
        w.length > 1 && w.endsWith('\n') ?
        [ w.slice(0, -1), '\n' ] : w
    ).flat()
}

// when measure is null, that means mandatory line break (but zero width)
function wrapWidths<T>(objects: T[], measure: (obj: T) => number | undefined, maxWidth?: number): { rows: T[][], widths: number[] } {
    // return values
    const rows: T[][] = []
    const widths: number[] = []

    // line accumulation
    let buffer: T[] = []
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
function wrapText(text: string, maxWidth: number | undefined, args: TextSizerArgs = {}): { rows: string[][], widths: number[] } {
    const chunks = splitWords(text.replace(/\s+/g, ' '))
    const measure = (c: string) => textSizer(c, args)
    return wrapWidths(chunks, measure, maxWidth)
}

function mergeStrings(items: any[]): any[] {
    const lines: any[] = []
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

export { is_emoji, textSizer, getBreaks, splitWords, wrapWidths, wrapText, mergeStrings }
