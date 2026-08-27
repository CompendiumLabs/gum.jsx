// element and context registries
//
// The JSX evaluator (lib/parse.ts) binds every registered name as a global of
// the evaluated code. Core (gum.ts) registers its constants, utilities and
// elements; add-ons such as the math elements register theirs separately, so a
// host that imports only core gets only core names.

import type { Element, ElementArgs } from '../elems/core'

type ElementConstructor = new (args: ElementArgs) => Element

// the registered element constructors by JSX tag name
const ELEMS: Record<string, ElementConstructor> = {}

// everything bound in evaluated code: constants, utilities and the elements
const CONTEXT: Record<string, unknown> = {}

// bind values (constants, functions) as globals of evaluated code
function registerContext(values: Record<string, unknown>): void {
    Object.assign(CONTEXT, values)
}

// register element constructors by tag name (also bound as globals)
function registerElements(elems: Record<string, ElementConstructor>): void {
    Object.assign(ELEMS, elems)
    Object.assign(CONTEXT, elems)
}

export { ELEMS, CONTEXT, registerContext, registerElements }
export type { ElementConstructor }
