// browser font paths

// import font paths

// @ts-ignore
const { default: sans } = await import('./IBMPlexSans-Variable.ttf?url')
// @ts-ignore
const { default: mono } = await import('./IBMPlexMono-Regular.ttf?url')
// @ts-ignore
const { default: moji } = await import('./NotoColorEmoji-Regular.ttf?url')
const FONT_PATHS: Record<string, string> = { sans, mono, moji }

// load font data as arraybuffer
async function loadFont(path: string): Promise<ArrayBuffer> {
    const response = await fetch(path)
    const buffer = await response.arrayBuffer()
    return buffer
}

export { FONT_PATHS, loadFont }
