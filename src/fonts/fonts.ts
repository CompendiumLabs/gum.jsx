import opentype from 'opentype.js'
import type { Font } from 'opentype.js'

import { sans, mono, moji } from '../lib/const'
import { is_browser } from '../lib/utils'

//
// load font data as arraybuffer
//

async function loadFont(path: string): Promise<ArrayBuffer> {
    if (is_browser()) {
        const response = await fetch(path)
        return response.arrayBuffer()
    } else {
        const fs = await import('fs/promises')
        const { buffer } = await fs.readFile(path)
        return buffer
    }
}

//
// load core fonts (vite resolves these as assets via static string analysis)
//

// @ts-ignore
const { default: sansPath } = await import('./IBMPlexSans-Variable.ttf')
// @ts-ignore
const { default: monoPath } = await import('./IBMPlexMono-Regular.ttf')

const FONT_PATHS: Record<string, string> = { sans: sansPath, mono: monoPath }

const FONT_DATA: Record<string, ArrayBuffer> = {
    sans: await loadFont(sansPath),
    mono: await loadFont(monoPath),
}

const FONTS: Record<string, Font> = {
    [sans]: opentype.parse(FONT_DATA.sans),
    [mono]: opentype.parse(FONT_DATA.mono),
}

//
// try to load emoji font (obfuscated path excludes it from vite bundles)
//

try {
    // @ts-ignore
    const mojiFile = './NotoColor' + 'Emoji-Regular.ttf'
    const { default: mojiPath } = await import(mojiFile)
    FONT_PATHS.moji = mojiPath
    FONT_DATA.moji = await loadFont(mojiPath)
    FONTS[moji] = opentype.parse(FONT_DATA.moji)
} catch {
    console.warn('Emoji font not found')
}

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS }
