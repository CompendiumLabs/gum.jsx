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
        const [ light, regular, bold ] = await Promise.all([
            loadFont(path.light), loadFont(path.regular), loadFont(path.bold),
        ])
        return { light, regular, bold }
    }
}

// synchronous variants (node only): used to load fonts on demand at first use
// @ts-ignore
const fs_sync = is_browser() ? null : await import('fs')

function loadFontSync(path: string): ArrayBuffer {
    if (fs_sync == null) throw new Error('Synchronous font loading is only available in node')
    const { buffer } = fs_sync.readFileSync(path)
    return buffer
}

function loadFontFamilySync(path: FontPath): FontData {
    if (is_string(path)) {
        return loadFontSync(path)
    } else {
        return {
            light: loadFontSync(path.light),
            regular: loadFontSync(path.regular),
            bold: loadFontSync(path.bold),
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

// named groups: text fonts are what ordinary gum text uses, math fonts are the
// KaTeX faces used by Latex/Tex; loading everything is the default but a math-
// only host (e.g. gum/math in the browser) can load just MATH_FONTS
const TEXT_FONTS: string[] = [ sans, mono, moji ]
const MATH_FONTS: string[] = [ 'KaTeX_Math', 'KaTeX_Main', 'KaTeX_AMS', 'KaTeX_Size1', 'KaTeX_Size2', 'KaTeX_Size3', 'KaTeX_Size4' ]
const CORE_FONTS: string[] = Object.keys(FONT_PATHS)

const FONT_DATA: Record<string, FontData> = {}
const FONTS: Record<string, FontEntry> = {}

function setFontEntry(name: string, data: FontData): void {
    FONT_DATA[name] = data
    FONTS[name] = parseFontFamily(data)
}

function loadFontEntrySync(name: string, path: FontPath): void {
    setFontEntry(name, loadFontFamilySync(path))
}

// one memoized promise per family, so partial loads (e.g. math only) followed
// by a full loadFonts() only fetch what is still missing
const FONT_PENDING: Map<string, Promise<void>> = new Map()

function loadFontEntry(name: string, path: FontPath): Promise<void> {
    let pending = FONT_PENDING.get(name)
    if (pending == null) {
        pending = loadFontFamily(path).then(data => setFontEntry(name, data))
        pending.catch(() => FONT_PENDING.delete(name)) // allow retry after failure
        FONT_PENDING.set(name, pending)
    }
    return pending
}

function ensure_names(names: string | string[]): string[] {
    return is_string(names) ? [ names ] : names
}

// load fonts by family name (default: all core fonts); memoized per family
function loadFonts(names: string | string[] = CORE_FONTS): Promise<void> {
    return Promise.all(ensure_names(names).map(name => {
        const path = FONT_PATHS[name]
        if (path == null) return Promise.reject(new Error(`Unknown font family: ${name}`))
        return loadFontEntry(name, path)
    })).then(() => {})
}

function loadMathFonts(): Promise<void> {
    return loadFonts(MATH_FONTS)
}

function loadTextFonts(): Promise<void> {
    return loadFonts(TEXT_FONTS)
}

// check whether the given fonts (default: all core fonts) are available for text measurement
function fontsLoaded(names: string | string[] = CORE_FONTS): boolean {
    return ensure_names(names).every(name => name in FONTS)
}

// get a loaded font entry; in node, core fonts are loaded on demand from disk
// (synchronously), so hosts never need to await loadFonts() there; in the
// browser the font must have been loaded beforehand, otherwise returns null
function getFont(name: string): FontEntry | null {
    const font = FONTS[name]
    if (font != null) return font
    const path = FONT_PATHS[name]
    if (path == null || is_browser()) return null
    loadFontEntrySync(name, path)
    return FONTS[name]
}

//
// allow additional fonts to be loaded
//

async function registerFont(name: string, path: string): Promise<void> {
    FONT_PATHS[name] = path
    FONT_PENDING.delete(name)
    await loadFontEntry(name, path)
}

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS, TEXT_FONTS, MATH_FONTS, CORE_FONTS, getFont, loadFonts, loadMathFonts, loadTextFonts, fontsLoaded, registerFont }
export type { FontWeight, FontSet, FontEntry }
