// node font paths

// import font paths
const FONT_PATHS: Record<string, string> = {
    sans: new URL('./IBMPlexSans-Variable.ttf', import.meta.url).pathname,
    mono: new URL('./IBMPlexMono-Regular.ttf', import.meta.url).pathname,
    moji: new URL('./NotoColorEmoji-Regular.ttf', import.meta.url).pathname,
}

// load font data as arraybuffer
async function loadFont(path: string): Promise<ArrayBuffer> {
    const fs = await import('fs/promises')
    const { buffer } = await fs.readFile(path)
    return buffer
}

export { FONT_PATHS, loadFont }
