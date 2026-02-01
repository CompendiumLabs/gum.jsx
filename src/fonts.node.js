// node font paths

// import font paths
const FONT_PATHS = {
    sans: new URL('./fonts/IBMPlexSans-Variable.ttf', import.meta.url).pathname,
    mono: new URL('./fonts/IBMPlexMono-Regular.ttf', import.meta.url).pathname,
    moji: new URL('./fonts/NotoColorEmoji-Regular.ttf', import.meta.url).pathname,
}

// load font data as arraybuffer
async function loadFont(path) {
    const fs = await import('fs/promises')
    const { buffer } = await fs.readFile(path)
    return buffer
}

export { FONT_PATHS, loadFont }
