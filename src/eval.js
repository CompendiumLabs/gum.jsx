// code evaluation

import { is_object, setTheme, Svg } from './gum.js'
import { runJSX } from './acorn.js'

//
// gum evaluator
//

class ErrorNoCode extends Error {
  constructor() {
    super('No code provided')
    this.name = 'ErrorNoCode'
  }
}

class ErrorParse extends Error {
  constructor(error) {
    super(error.message)
    this.name = 'ErrorParse'
    this.error = error
  }
}

class ErrorNoReturn extends Error {
  constructor() {
    super('No return value')
    this.name = 'ErrorNoReturn'
  }
}

class ErrorNoElement extends Error {
  constructor(value) {
    super('No element returned')
    this.name = 'ErrorNoElement'
    this.value = value
  }
}

function evaluateGum(code, { theme, debug = false, ...args } = {}) {
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
  if (!is_object(element)) {
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

export { evaluateGum, ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorParse }
