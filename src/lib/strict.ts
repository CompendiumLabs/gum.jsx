// strict mode
//
// Rendering has a number of fallbacks that keep a bad document drawing rather
// than failing: an unparseable formula becomes red literal text, an unhandled
// katex node becomes empty space, an unknown command name gets drawn verbatim,
// a missing glyph gets measured as .notdef. That is the right default for
// authoring, but it hides real breakage from a test suite. Strict mode turns
// each of those fallbacks into a thrown StrictError instead. It is a flag on
// the Env (src/env.ts) an element is constructed against.

import { resolveEnv } from './default'
import type { Env } from '../env'

// the kinds of fallback that can be reported
type StrictKind =
    | 'parse'   // tex that katex could not parse
    | 'node'    // katex parse node with no gum equivalent
    | 'symbol'  // command name with no entry in katex's symbol table
    | 'font'    // tex font command with no gum font family mapped
    | 'glyph'   // character absent from the font it was resolved to

class StrictError extends Error {
    kind: StrictKind

    constructor(kind: StrictKind, message: string) {
        super(`${kind}: ${message}`)
        this.name = 'StrictError'
        this.kind = kind
    }
}

// whether the given Env (default: the default Env) is strict
function isStrict(env?: Env): boolean {
    return resolveEnv(env).strict
}

// report a rendering fallback: throws in strict mode, otherwise returns and
// lets the caller carry on with whatever it drew before
function strictError(env: Env | undefined, kind: StrictKind, message: string): void {
    if (isStrict(env)) throw new StrictError(kind, message)
}

//
// exports
//

export { StrictError, isStrict, strictError }
export type { StrictKind }
