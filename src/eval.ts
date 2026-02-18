// code evaluation

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

interface EvaluateArgs extends SvgArgs {
  theme?: string
  debug?: boolean
}

function evaluateGum(code: string, { theme, debug = false, ...args }: EvaluateArgs = {}): Svg {
  // check if code is provided
  if (code == null || code.trim() == '') {
    throw new ErrorNoCode()
  }

  // set theme
  if (theme != null) {
    setTheme(theme)
  }

  // parse to property tree
  const result = runJSX(code, debug)

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

  console.log(result)

  // return result
  return result
}

//
// export
//

export { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender, runJSX, evaluateGum }
export type { EvaluateArgs }
