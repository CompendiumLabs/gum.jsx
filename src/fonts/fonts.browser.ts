// browser font paths

// import font paths

// @ts-ignore
import sans from './IBMPlexSans-Variable.ttf'
// @ts-ignore
import mono from './IBMPlexMono-Regular.ttf'
// @ts-ignore
import moji from './NotoColorEmoji-Regular.ttf'
const FONT_PATHS: Record<string, string> = { sans, mono, moji }

// load font data as arraybuffer
async function loadFont(path: string): Promise<ArrayBuffer> {
    const response = await fetch(path)
    const buffer = await response.arrayBuffer()
    return buffer
}

export { FONT_PATHS, loadFont }
