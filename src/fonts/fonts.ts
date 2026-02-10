import opentype from 'opentype.js'
import type { Font } from 'opentype.js'

import { sans, mono, moji } from '../lib/const'
import { is_browser } from '../lib/utils'

const { FONT_PATHS, loadFont } = is_browser() ?
    await import('./fonts.browser') :
    await import('./fonts.node')
const FONT_NAMES = { sans, mono, moji }

//
// load font data
//

const FONT_DATA: Record<string, ArrayBuffer> = Object.fromEntries(
    await Promise.all(
        Object.entries(FONT_PATHS).map(
            async ([ k, v ]: [string, string]) => [ k, await loadFont(v) ]
        )
    )
)

const FONTS: Record<string, Font> = Object.fromEntries(
    Object.entries(FONT_DATA).map(
        ([ k, v ]) => [ FONT_NAMES[k], opentype.parse(v, {}) ]
    )
)

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS }
