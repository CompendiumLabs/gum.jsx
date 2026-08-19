import { parse as parseFont, type Font } from 'opentype.js'
import { is_browser, is_string } from '../lib/utils'
import { sans, mono, moji } from '../lib/const'

//
// load font data as arraybuffer
//

type FontWeight = 'light' | 'regular' | 'bold'
type FontPath = string | Record<FontWeight, string>
type FontData = ArrayBuffer | Record<FontWeight, ArrayBuffer>
type FontSet = Record<FontWeight, Font>
type FontEntry = Font | FontSet

async function loadFont(path: string): Promise<ArrayBuffer> {
    if (is_browser()) {
        const response = await fetch(path)
        return response.arrayBuffer()
    } else {
        // @ts-ignore
        const fs = await import('fs/promises')
        const { buffer } = await fs.readFile(path)
        return buffer
    }
}

async function loadFontFamily(path: FontPath): Promise<FontData> {
    if (is_string(path)) {
        return await loadFont(path)
    } else {
        return {
            light: await loadFont(path.light),
            regular: await loadFont(path.regular),
            bold: await loadFont(path.bold),
        }
    }
}

function parseFontFamily(data: FontData): FontEntry {
    if (data instanceof ArrayBuffer) {
        return parseFont(data)
    } else {
        return {
            light: parseFont(data.light),
            regular: parseFont(data.regular),
            bold: parseFont(data.bold),
        }
    }
}

//
// load core fonts (vite resolves these as assets via static string analysis)
//

const FONT_PATHS: Record<string, FontPath> = {
    [sans]: {
        // @ts-ignore
        light: (await import('./IBMPlexSans-Light.ttf')).default,
        // @ts-ignore
        regular: (await import('./IBMPlexSans-Regular.ttf')).default,
        // @ts-ignore
        bold: (await import('./IBMPlexSans-Bold.ttf')).default,
    },
    [mono]: {
        // @ts-ignore
        light: (await import('./IBMPlexMono-Light.ttf')).default,
        // @ts-ignore
        regular: (await import('./IBMPlexMono-Regular.ttf')).default,
        // @ts-ignore
        bold: (await import('./IBMPlexMono-Bold.ttf')).default,
    },
    // @ts-ignore
    [moji]: (await import('./NotoEmoji-Variable.ttf')).default,
    // @ts-ignore
    'KaTeX_Math': (await import('katex/dist/fonts/KaTeX_Math-Italic.ttf')).default,
    // @ts-ignore
    'KaTeX_Main': (await import('katex/dist/fonts/KaTeX_Main-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_AMS': (await import('katex/dist/fonts/KaTeX_AMS-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size1': (await import('katex/dist/fonts/KaTeX_Size1-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size2': (await import('katex/dist/fonts/KaTeX_Size2-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size3': (await import('katex/dist/fonts/KaTeX_Size3-Regular.ttf')).default,
    // @ts-ignore
    'KaTeX_Size4': (await import('katex/dist/fonts/KaTeX_Size4-Regular.ttf')).default,
}

//
// font registry (populated by loadFonts / registerFont)
//

const CORE_FONTS: string[] = Object.keys(FONT_PATHS)
const FONT_DATA: Record<string, FontData> = {}
const FONTS: Record<string, FontEntry> = {}

async function loadFontEntry(name: string, path: FontPath): Promise<void> {
    const data = await loadFontFamily(path)
    FONT_DATA[name] = data
    FONTS[name] = parseFontFamily(data)
}

// load all core fonts (memoized, so this is cheap to call repeatedly)
let fontsReady: Promise<void> | null = null
function loadFonts(): Promise<void> {
    fontsReady ??= Promise.all(
        CORE_FONTS.map(name => loadFontEntry(name, FONT_PATHS[name]))
    ).then(() => {})
    return fontsReady
}

// check whether the core fonts are available for text measurement
function fontsLoaded(): boolean {
    return CORE_FONTS.every(name => name in FONTS)
}

//
// allow additional fonts to be loaded
//

async function registerFont(name: string, path: string): Promise<void> {
    FONT_PATHS[name] = path
    await loadFontEntry(name, path)
}

//
// initial load: in node the fonts are local files so we load them eagerly;
// in the browser we start the download immediately but do not block module
// evaluation, so hosts must `await loadFonts()` before evaluating gum code
//

if (is_browser()) {
    loadFonts().catch(() => {})
} else {
    await loadFonts()
}

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS, loadFonts, fontsLoaded, registerFont }
export type { FontWeight, FontSet, FontEntry }
