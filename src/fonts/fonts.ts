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
// font registry
//

// a registry name is one font file (or a light/regular/bold set), but the SVG
// output (and any @font-face rules a host writes) may need to address a face
// the way fontconfig and browsers know it: by a base family plus a weight and
// a style. Faces that are their own family need no entry here.
type FontFace = { family: string, weight?: number, style?: 'italic' }

// the file(s) behind each registered family name; populated by registerFonts
const FONT_PATHS: Record<string, FontPath> = {}

// the css face for registry names that are not their own family
const FONT_FACES: Record<string, FontFace> = {}

// the css face for a registry name (the name itself for ordinary families)
function fontFace(name: string): FontFace {
    return FONT_FACES[name] ?? { family: name }
}

// the family names registered so far (the default set for loadFonts)
function registeredFonts(): string[] {
    return Object.keys(FONT_PATHS)
}

// make families known to the registry without loading them: in node they are
// read from disk on first use, in the browser a host loads them with
// loadFonts. Core registers its text fonts below; the math fonts are
// registered by fonts/math.ts.
function registerFonts(paths: Record<string, FontPath>, faces: Record<string, FontFace> = {}): void {
    for (const [ name, path ] of Object.entries(paths)) {
        FONT_PATHS[name] = path
        FONT_PENDING.delete(name)
        delete FONTS[name]
        delete FONT_DATA[name]
    }
    Object.assign(FONT_FACES, faces)
}

//
// loaded fonts
//

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

// load fonts by family name (default: everything registered); memoized per family
function loadFonts(names: string | string[] = registeredFonts()): Promise<void> {
    return Promise.all(ensure_names(names).map(name => {
        const path = FONT_PATHS[name]
        if (path == null) return Promise.reject(new Error(`Unknown font family: ${name}`))
        return loadFontEntry(name, path)
    })).then(() => {})
}

// check whether the given fonts (default: everything registered) are available for text measurement
function fontsLoaded(names: string | string[] = registeredFonts()): boolean {
    return ensure_names(names).every(name => name in FONTS)
}

// get a loaded font entry; in node, registered fonts are loaded on demand from
// disk (synchronously), so hosts never need to await loadFonts() there; in the
// browser the font must have been loaded beforehand, otherwise returns null
function getFont(name: string): FontEntry | null {
    const font = FONTS[name]
    if (font != null) return font
    const path = FONT_PATHS[name]
    if (path == null || is_browser()) return null
    loadFontEntrySync(name, path)
    return FONTS[name]
}

// register one family and load it right away
async function registerFont(name: string, path: FontPath, face?: FontFace): Promise<void> {
    registerFonts({ [name]: path }, face != null ? { [name]: face } : {})
    await loadFontEntry(name, path)
}

//
// core text fonts (vite resolves these as assets via static string analysis)
//

const TEXT_FONT_PATHS: Record<string, FontPath> = {
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
}

// what ordinary gum text uses (the math fonts are in fonts/math.ts)
const TEXT_FONTS: string[] = Object.keys(TEXT_FONT_PATHS)

registerFonts(TEXT_FONT_PATHS)

function loadTextFonts(): Promise<void> {
    return loadFonts(TEXT_FONTS)
}

//
// exports
//

export { FONT_PATHS, FONT_FACES, FONT_DATA, FONTS, TEXT_FONTS, registeredFonts, getFont, fontFace, registerFonts, registerFont, loadFonts, loadTextFonts, fontsLoaded }
export type { FontWeight, FontPath, FontSet, FontEntry, FontFace }
