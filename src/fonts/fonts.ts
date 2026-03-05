import { parse as parseFont, type Font } from 'opentype.js'
import { is_browser, map_object, map_object_async } from '../lib/utils'

//
// load font data as arraybuffer
//

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

//
// load core fonts (vite resolves these as assets via static string analysis)
//

const FONT_PATHS: Record<string, string> = {
    // @ts-ignore
    sans: (await import('./IBMPlexSans-Variable.ttf')).default,
    // @ts-ignore
    mono: (await import('./IBMPlexMono-Regular.ttf')).default,
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

const FONT_DATA: Record<string, ArrayBuffer> = await map_object_async(FONT_PATHS,
    async (_name: string, path: string) => await loadFont(path)
)

const FONTS: Record<string, Font> = map_object(FONT_DATA,
    (_name, data) => parseFont(data)
)

//
// allow additional fonts to be loaded
//

async function registerFont(name: string, path: string) {
    FONT_PATHS[name] = path
    FONT_DATA[name] = await loadFont(path)
    FONTS[name] = parseFont(FONT_DATA[name])
}

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS, registerFont }
