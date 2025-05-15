// code evaluation

import React, { useEffect, useState } from 'react'
import * as Babel from '@babel/standalone'

import Gum from './gum'
import * as Utils from './utils'

//
// gum environment
//

// import math functions
const MATH_KEYS = [
  'PI', 'sin', 'cos', 'tan'
]
const MATH_VALS = MATH_KEYS.map(key => Math[key])
MATH_KEYS[0] = 'pi' // patch pi

// import utility functions
const UTIL_KEYS = [
  'red', 'green', 'blue', 'palette', 'zip', 'range', 'linspace'
]
const UTIL_VALS = UTIL_KEYS.map(key => Utils[key])

// import gum components
const GUM_KEYS = [
  'Group', 'Svg', 'Frame', 'Stack', 'HStack', 'VStack', 'Spacer', 'Rect', 'Square', 'Ellipse', 'Circle', 'Line', 'Polyline', 'Polygon', 'Text', 'Symline', 'Sympoly', 'Graph'
]
const GUM_VALS = GUM_KEYS.map(key => Gum[key])

// combine keys and values
const KEYS = [...MATH_KEYS, ...UTIL_KEYS, ...GUM_KEYS]
const VALS = [...MATH_VALS, ...UTIL_VALS, ...GUM_VALS]

//
// dynamic jsx
//

function DynamicJSX({ code }) {
  const [element, setElement] = useState(null)
  const [error, setError] = useState(null)

  // memoize the element
  useEffect(() => {
    try {
      // reset the error
      setError(null)

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

      // set the element
      setElement(element)
    } catch (error) {
      setError(error.message)
    }
  }, [code])

  // error short circuit
  if (error) {
    return <div className="text-red-500 whitespace-pre-wrap font-mono">{error}</div>
  }

  // return the element
  return element ?? null
}

//
// export
//

export { DynamicJSX }
