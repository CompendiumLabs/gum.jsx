/// <reference path="../types/opentype.d.ts" />

import { parse as parseFont, type Font } from 'opentype.js'
import { is_browser, is_string } from '../lib/utils'
import { sans, mono } from '../lib/const'
import { resolveEnv } from '../lib/default'
import type { Env } from '../env'

// the bundled text font files (static imports, so importing this module never
// needs a top-level await)
// @ts-ignore
import IBMPlexSansLight from './IBMPlexSans-Light.ttf'
// @ts-ignore
import IBMPlexSansRegular from './IBMPlexSans-Regular.ttf'
// @ts-ignore
import IBMPlexSansBold from './IBMPlexSans-Bold.ttf'
// @ts-ignore
import IBMPlexMonoLight from './IBMPlexMono-Light.ttf'
// @ts-ignore
import IBMPlexMonoRegular from './IBMPlexMono-Regular.ttf'
// @ts-ignore
import IBMPlexMonoBold from './IBMPlexMono-Bold.ttf'

//
// load font data as arraybuffer
//

type FontWeight = 'light' | 'regular' | 'bold'
type FontPath = string | Record<FontWeight, string>
type FontData = ArrayBuffer | Record<FontWeight, ArrayBuffer>
type FontSet = Record<FontWeight, Font>
type FontEntry = Font | FontSet

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

// synchronous variants (node only): used to load fonts on demand at first
// use. The builtin is reached through process.getBuiltinModule (bun and node)
// rather than a top-level `await import`, which would make every importer's
// module graph async; in the browser there is no builtin and loading stays
// with `load`
function fs_sync(): typeof import('fs') | null {
    return (globalThis as any).process?.getBuiltinModule?.('node:fs') ?? null
}

function loadFontSync(path: string): ArrayBuffer {
    const fs = fs_sync()
    if (fs == null) throw new Error('Synchronous font loading is only available in node')
    const { buffer } = fs.readFileSync(path)
    return buffer
}

//
// loaded files
//
// Font files are process-wide resources: the bytes and the parsed opentype
// Font are cached here by file path, so every Env that registers the same
// family shares one copy and one fetch, and re-registering a family under a
// new path simply reads the new file.

const FILE_DATA: Map<string, ArrayBuffer> = new Map()
const FILE_FONT: Map<string, Font> = new Map()

// one memoized promise per file, so partial loads (e.g. math only) followed
// by a full load only fetch what is still missing
const FILE_PENDING: Map<string, Promise<void>> = new Map()

function setFileData(path: string, data: ArrayBuffer): void {
    FILE_DATA.set(path, data)
    FILE_FONT.set(path, parseFont(data))
}

function loadFile(path: string): Promise<void> {
    if (FILE_DATA.has(path)) return Promise.resolve()
    let pending = FILE_PENDING.get(path)
    if (pending == null) {
        pending = loadFont(path).then(data => setFileData(path, data))
        pending.catch(() => FILE_PENDING.delete(path)) // allow retry after failure
        FILE_PENDING.set(path, pending)
    }
    return pending
}

// the parsed font for a file; in node an unloaded file is read from disk
// synchronously, in the browser it must have been loaded beforehand (null)
function fileFont(path: string): Font | null {
    const font = FILE_FONT.get(path)
    if (font != null) return font
    if (is_browser()) return null
    setFileData(path, loadFontSync(path))
    return FILE_FONT.get(path)!
}

// the files behind a family path
function fontFiles(path: FontPath): string[] {
    return is_string(path) ? [ path ] : [ path.light, path.regular, path.bold ]
}

//
// font registry
//

// a registry name is one font file (or a light/regular/bold set), but the SVG
// output (and any @font-face rules a host writes) may need to address a face
// the way fontconfig and browsers know it: by a base family plus a weight and
// a style. Faces that are their own family need no entry here.
type FontFace = { family: string, weight?: number, style?: 'italic' }

// what a plugin contributes to a registry (see EnvPlugin in src/env.ts)
type FontPlugin = { paths: Record<string, FontPath>, faces?: Record<string, FontFace> }

// thrown by text measurement when a font is registered but not loaded yet (browser
// only); `font` names the family so a host can env.loadFonts([font]) and retry
class FontNotLoadedError extends Error {
    font: string
    constructor(font: string) {
        super(`Font not loaded: '${font}' (await env.loadFonts(['${font}']) or env.loadFonts() before evaluating)`)
        this.name = 'FontNotLoadedError'
        this.font = font
    }
}

// the families an Env knows by name: the file(s) behind each and, for names
// that are not their own css family, the face. Registering makes a family
// known without loading it: in node the files are read from disk on first
// use, in the browser a host loads them with `load`.
class FontRegistry {
    paths: Record<string, FontPath>
    faces: Record<string, FontFace>

    constructor(paths: Record<string, FontPath> = {}, faces: Record<string, FontFace> = {}) {
        this.paths = {}
        this.faces = {}
        this.register(paths, faces)
    }

    // an independent registry with the same families
    clone(): FontRegistry {
        return new FontRegistry(this.paths, this.faces)
    }

    register(paths: Record<string, FontPath>, faces: Record<string, FontFace> = {}): this {
        Object.assign(this.paths, paths)
        Object.assign(this.faces, faces)
        return this
    }

    // the family names registered so far
    names(): string[] {
        return Object.keys(this.paths)
    }

    has(name: string): boolean {
        return name in this.paths
    }

    // the file(s) behind a family
    path(name: string): FontPath {
        const path = this.paths[name]
        if (path == null) throw new Error(`Unknown font family: '${name}' (register it with env.registerFonts or a plugin)`)
        return path
    }

    // the css face for a registry name (the name itself for ordinary families)
    face(name: string): FontFace {
        return this.faces[name] ?? { family: name }
    }

    // load families by name (default: everything registered); memoized per file
    load(names: string | string[] = this.names()): Promise<void> {
        const files = ensure_names(names).flatMap(name => fontFiles(this.path(name)))
        return Promise.all(files.map(loadFile)).then(() => {})
    }

    // whether the given families (default: everything registered) are available for text measurement
    loaded(names: string | string[] = this.names()): boolean {
        return ensure_names(names).every(name => this.has(name) && fontFiles(this.paths[name]!).every(f => FILE_DATA.has(f)))
    }

    // the parsed font for a family, for measurement; null if it is registered
    // but not loaded (browser); throws for an unknown family
    get(name: string): FontEntry | null {
        const path = this.path(name)
        if (is_string(path)) return fileFont(path)
        const light = fileFont(path.light), regular = fileFont(path.regular), bold = fileFont(path.bold)
        if (light == null || regular == null || bold == null) return null
        return { light, regular, bold }
    }

    // the loaded bytes for a family (for handing to FontFace or embedding); null if not loaded
    data(name: string): FontData | null {
        const path = this.path(name)
        if (is_string(path)) return FILE_DATA.get(path) ?? null
        const light = FILE_DATA.get(path.light), regular = FILE_DATA.get(path.regular), bold = FILE_DATA.get(path.bold)
        if (light == null || regular == null || bold == null) return null
        return { light, regular, bold }
    }
}

function ensure_names(names: string | string[]): string[] {
    return is_string(names) ? [ names ] : names
}

//
// core text fonts (bundlers resolve the static imports above as asset urls,
// bun and node as file paths)
//

const TEXT_FONT_PATHS: Record<string, FontPath> = {
    [sans]: { light: IBMPlexSansLight, regular: IBMPlexSansRegular, bold: IBMPlexSansBold },
    [mono]: { light: IBMPlexMonoLight, regular: IBMPlexMonoRegular, bold: IBMPlexMonoBold },
}

// what ordinary gum text uses (the math fonts are in @gum-jsx/math); emoji
// are measured with a constant advance (lib/text.ts) and drawn by whatever
// emoji face the renderer falls back to, so none is bundled
const TEXT_FONTS: string[] = Object.keys(TEXT_FONT_PATHS)

// the text fonts as a plugin (every Env starts with it, see corePlugin in src/env.ts)
const TEXT_FONT_PLUGIN: FontPlugin = { paths: TEXT_FONT_PATHS }

// load the text fonts into an Env (default: the default Env)
function loadTextFonts(env?: Env): Promise<void> {
    return resolveEnv(env).fonts.load(TEXT_FONTS)
}

//
// exports
//

export { FontRegistry, FontNotLoadedError, TEXT_FONT_PATHS, TEXT_FONT_PLUGIN, TEXT_FONTS, loadTextFonts, fontFiles }
export type { FontWeight, FontPath, FontSet, FontEntry, FontData, FontFace, FontPlugin }
