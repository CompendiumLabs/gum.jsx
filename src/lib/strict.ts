// strict mode
//
// Rendering has a number of fallbacks that keep a bad document drawing rather
// than failing: an unparseable formula becomes red literal text, an unhandled
// katex node becomes empty space, an unknown command name gets drawn verbatim,
// a missing glyph gets measured as .notdef. That is the right default for
// authoring, but it hides real breakage from a test suite. Strict mode turns
// each of those fallbacks into a thrown StrictError instead.

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

// strict state
let strict = false

function setStrict(value: boolean): void {
    strict = value
}

function isStrict(): boolean {
    return strict
}

// report a rendering fallback: throws in strict mode, otherwise returns and
// lets the caller carry on with whatever it drew before
function strictError(kind: StrictKind, message: string): void {
    if (strict) throw new StrictError(kind, message)
}

//
// exports
//

export { StrictError, setStrict, isStrict, strictError }
export type { StrictKind }
