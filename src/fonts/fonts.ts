import opentype from 'opentype.js'
import type { Font } from 'opentype.js'

import { sans, mono } from '../lib/const'
import { is_browser } from '../lib/utils'

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
// allow additional fonts to be loaded
//

async function registerFont(name: string, path: string) {
    FONT_PATHS[name] = path
    FONT_DATA[name] = await loadFont(path)
    FONTS[name] = opentype.parse(FONT_DATA[name])
}

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS, registerFont }
