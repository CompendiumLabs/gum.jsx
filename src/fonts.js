import opentype from 'opentype.js'

import { CONSTANTS as C } from './defaults.js'
import { is_browser } from './utils.js'

const { FONT_PATHS, loadFont } = is_browser() ?
    await import('./fonts.browser.js') :
    await import('./' + 'fonts.node.js') // vite-ignore hack

//
// load font data
//

const FONT_DATA = Object.fromEntries(
    await Promise.all(
        Object.entries(FONT_PATHS).map(
            async ([ k, v ]) => [ k, await loadFont(v) ]
        )
    )
)

const FONTS = Object.fromEntries(
    Object.entries(FONT_DATA).map(
        ([ k, v ]) => [ C[k], opentype.parse(v) ]
    )
)

//
// exports
//

export { FONT_PATHS, FONT_DATA, FONTS, loadFont }
