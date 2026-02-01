import opentype from 'opentype.js'

import { CONSTANTS as C } from './defaults.js'
import { is_browser } from './utils.js'

const { FONT_PATHS, loadFont } = is_browser() ?
    await import('./fonts.browser.js') :
    await import('./' + 'fonts.node.js') // vite-ignore hack

//
// load font data
//

async function parseFont(path) {
    const buffer = await loadFont(path)
    return opentype.parse(buffer)
}

const FONTS = Object.fromEntries(
    await Promise.all(
        Object.entries(FONT_PATHS).map(
            async ([ k, v ]) => [ C[k], await parseFont(v) ]
        )
    )
)

//
// exports
//

export { FONTS }
