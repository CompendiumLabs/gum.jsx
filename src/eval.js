// code evaluation

import { is_element, setTheme, Svg } from './gum.js'
import { runJSX } from './acorn.js'

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
  constructor(value) {
      super(`Non-element returned: ${JSON.stringify(value)}`)
      this.value = value
  }
}

class ErrorGenerate extends Error {
  constructor(message) {
      super(`Generation error: ${message}`)
  }
}

class ErrorRender extends Error {
  constructor(message) {
      super(`Render error: ${message}`)
  }
}

//
// gum evaluator
//

function evaluateGum(code, { theme = null, debug = false, ...args } = {}) {
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
    return new Svg({ children: result, ...args })
  }

  // return result
  return result
}

//
// export
//

export { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender, runJSX, evaluateGum }
