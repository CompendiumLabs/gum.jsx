// code evaluation

import * as Papa from 'papaparse'
import type { ParseConfig, ParseResult } from 'papaparse'

import { setTheme } from './lib/theme'
import { is_element, Svg } from './elems/core'
import type { SvgArgs } from './elems/core'
import { runJSX } from './lib/parse'

//
// types
//

class ErrorNoCode extends Error {
  constructor() {
      super('No code provided')
  }
}

class ErrorNoReturn extends Error {
  constructor() {
      super()
  }
}

class ErrorNoElement extends Error {
  value: any

  constructor(value: any) {
      super(`Non-element returned: ${JSON.stringify(value)}`)
      this.value = value
  }
}

class ErrorGenerate extends Error {
  constructor(message: string) {
      super(`Generation error: ${message}`)
  }
}

class ErrorRender extends Error {
  constructor(message: string) {
      super(`Render error: ${message}`)
  }
}

//
// gum evaluator
//

interface LoadFileArgs {
  encoding?: string | 'bytes'
}

type LoadFileData = string | Uint8Array
type LoadFile = (path: string, args?: LoadFileArgs) => LoadFileData

interface LoadTableArgs<T = Record<string, unknown>> extends ParseConfig<T> {
  encoding?: string
}

type LoadTable = <T = Record<string, unknown>>(path: string, args?: LoadTableArgs<T>) => ParseResult<T>

interface EvaluateArgs extends SvgArgs {
  theme?: string
  context?: Record<string, any>
  debug?: boolean
  loadFile?: LoadFile
}

function makeLoadTable(loadFile: LoadFile): LoadTable {
  return function loadTable<T = Record<string, unknown>>(
    path: string,
    { encoding = 'utf8', header = true, skipEmptyLines = 'greedy', ...args }: LoadTableArgs<T> = {},
  ): ParseResult<T> {
    const text = loadFile(path, { encoding })

    if (typeof text !== 'string') {
      throw new TypeError(`loadTable("${path}") expected text from loadFile, received bytes`)
    }

    return Papa.parse<T>(text, { header, skipEmptyLines, ...args })
  }
}

function evaluateGum(code: string, { theme, context = {}, debug = false, loadFile, ...args }: EvaluateArgs = {}): Svg {
  // check if code is provided
  if (code == null || code.trim() == '') {
    throw new ErrorNoCode()
  }

  // set theme
  if (theme != null) {
    setTheme(theme)
  }

  // create evaluation context
  const evalContext = loadFile == null ? context : {
    ...context,
    loadFile: loadFile,
    loadTable: makeLoadTable(loadFile),
  }

  // parse to property tree
  const result = runJSX(code, evalContext, debug)

  // handle array result (from JSX fragments)
  if (Array.isArray(result)) {
    return new Svg({ children: result, ...args })
  }

  // check if its actually a tree
  if (!is_element(result)) {
    if (result == null) {
      throw new ErrorNoReturn()
    } else {
      throw new ErrorNoElement(result)
    }
  }

  // wrap it in Svg if not already
  if (!(result instanceof Svg)) {
    return new Svg({ children: [ result ], ...args })
  }

  // return result
  return result
}

//
// export
//

export { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender, runJSX, evaluateGum }
export type { EvaluateArgs, LoadFileArgs, LoadFileData, LoadFile, LoadTableArgs, LoadTable }
