// code evaluation

import { is_element, setTheme, Svg } from './gum.js'
import { ErrorNoCode, ErrorNoReturn, ErrorNoElement } from './types.js'
import { runJSX } from './acorn.js'

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

export { evaluateGum }
