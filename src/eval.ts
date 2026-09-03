// code evaluation against the default Env
//
// `evaluateGum(code, args)` is `defaultEnv().evaluate(code, args)` (see
// src/env.ts for Env, which is where the evaluator lives); a host that wants
// its own element set or settings makes an Env and calls `evaluate` on it.

import { ensure_pair } from './lib/utils'
import { parseTable } from './lib/table'
import { runJSX, runPrelude } from './lib/parse'
import { defaultEnv, ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender, ErrorSyntax, ErrorRuntime } from './env'
import type { EvaluateArgs, PreludeArgs, TableRow, LoadTable, Bindings } from './env'
import type { Svg } from './elems/core'
import type { Size } from './lib/types'

// evaluate shared code (a prelude of declarations) against the default Env
function evaluatePrelude(code: string, args: PreludeArgs = {}): Bindings {
  return defaultEnv().prelude(code, args)
}

// evaluate gum.jsx code against the default Env
function evaluateGum(code: string, args: EvaluateArgs = {}): Svg {
  return defaultEnv().evaluate(code, args)
}

function fitSize([ w0, h0 ]: Size, max_size?: Size | number): Size {
  if (max_size == null) return [ w0, h0 ]
  const [ maxW, maxH ] = ensure_pair(max_size)
  const scale = Math.min(maxW / w0, maxH / h0)
  return [
    Math.max(1, Math.round(w0 * scale)),
    Math.max(1, Math.round(h0 * scale)),
  ]
}

//
// export
//

export { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender, ErrorSyntax, ErrorRuntime, runJSX, runPrelude, evaluateGum, evaluatePrelude, parseTable, fitSize }
export type { EvaluateArgs, PreludeArgs, TableRow, LoadTable, Bindings }
