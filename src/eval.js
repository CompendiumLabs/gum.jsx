// code evaluation

import { is_element, setTheme, Svg } from './gum.js'
import { ErrorNoCode, ErrorParse, ErrorNoReturn, ErrorNoElement } from './types.js'
import { runJSX } from './acorn.js'

//
// gum evaluator
//

function evaluateGum(code, { theme = null, debug = false, ...args } = {}) {
  let element

  // check if code is provided
  if (code == null || code.trim() == '') {
    throw new ErrorNoCode()
  }

  // set theme
  if (theme != null) {
    setTheme(theme)
  }

  // parse to property tree
  try {
    element = runJSX(code, debug)
  } catch (err) {
    throw new ErrorParse(err)
  }

  // check if its actually a tree
  if (!is_element(element)) {
    if (element == null) {
      throw new ErrorNoReturn()
    } else {
      throw new ErrorNoElement(element)
    }
  }

  // wrap it in Svg if not already
  try {
    if (!(element instanceof Svg)) {
      element = new Svg({ children: element, ...args })
    }
  } catch (err) {
    throw new ErrorParse(err)
  }

  // return element
  return element
}

//
// export
//

export { evaluateGum }
