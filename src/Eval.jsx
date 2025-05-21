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
  'red', 'green', 'blue', 'gray', 'palette', 'zip', 'range', 'linspace', 'pi', 'phi'
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
    const { code: transformedCode } = Babel.transform(wrappedCode, { presets })

    // create a function that returns the React element
    const functionBody = `return ${transformedCode}`
    const executeFunction = new Function('React', ...KEYS, functionBody)
    const element = executeFunction(React, ...VALS)

    // if its a function, run it now
    if (Utils.isFunction(element)) element = element()

    // set the element
    return [element, null]
  } catch (error) {
    return [ null, error.message ]
  }
}

//
// export
//

export { evaluateGum }
