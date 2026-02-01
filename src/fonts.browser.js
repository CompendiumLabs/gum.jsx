// browser font paths

// import font paths
const { default: sans } = await import('./fonts/IBMPlexSans-Variable.ttf?url')
const { default: mono } = await import('./fonts/IBMPlexMono-Regular.ttf?url')
const { default: moji } = await import(/* @vite-ignore */ './fonts/NotoColorEmoji-Regular.ttf?url')
const FONT_PATHS = { sans, mono, moji }

// load font data as arraybuffer
async function loadFont(path) {
    const response = await fetch(path)
    const buffer = await response.arrayBuffer()
    return buffer
}

export { FONT_PATHS, loadFont }
