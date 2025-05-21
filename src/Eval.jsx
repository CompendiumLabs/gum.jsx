// code evaluation

import React from 'react'
import * as Babel from '@babel/standalone'

import Gum from './gum'
import * as Utils from './utils'

//
// gum environment
//

// import math functions
const MATH_KEYS = [
  'sin', 'cos', 'tan'
]
const MATH_VALS = MATH_KEYS.map(key => Math[key])

// import utility functions
const UTIL_KEYS = [
  'red', 'green', 'blue', 'gray', 'none', 'palette', 'zip', 'range', 'linspace', 'repeat', 'pi', 'phi'
]
const UTIL_VALS = UTIL_KEYS.map(key => Utils[key])

// import gum components
const GUM_KEYS = [
  'Group', 'Svg', 'Frame', 'Stack', 'HStack', 'VStack', 'Spacer', 'Rect', 'Square', 'Ellipse', 'Circle', 'Line', 'Polyline', 'Polygon', 'UnitLine', 'HLine', 'VLine', 'Text', 'TextBox', 'Symline', 'Sympoly', 'HRuler', 'VRuler', 'Graph'
]
const GUM_VALS = GUM_KEYS.map(key => Gum[key])

// combine keys and values
const KEYS = [...MATH_KEYS, ...UTIL_KEYS, ...GUM_KEYS]
const VALS = [...MATH_VALS, ...UTIL_VALS, ...GUM_VALS]

//
// dynamic jsx
//

function evaluateGum(code) {
  try {
    // wrap code in a function if it's not an element
    const isElement = code.trim().startsWith('<')
    const wrappedCode = isElement ? code : `function run() { ${code} }`

    // transform JSX to JavaScript
    const presets = ['react']
    const { code: transformed } = Babel.transform(wrappedCode, { presets })

    // create a function that returns the React element
    const runnable = `return ${transformed}`
    const executor = new Function('React', ...KEYS, runnable)
    const result = executor(React, ...VALS)

    // if its a function, run it now
    const element = Utils.isFunction(result) ? result() : result

    // check if there's a return value
    if (element == null) {
      return [ null, 'No return value' ]
    }

    // check if its actually a React element
    const { type } = element
    if (type == null) {
      const string = element.toString()
      return [ null, `Return value:\n\n${string}` ]
    }

    // wrap in Svg if not already
    const { name } = type
    if (name != 'Svg') {
      return [ <Gum.Svg>{element}</Gum.Svg>, null ]
    }

    // set the element
    return [ element, null ]
  } catch (error) {
    return [ null, error.message ]
  }
}

//
// export
//

export { evaluateGum }
