// code evaluation

import { transform, registerPlugin } from '@babel/standalone'

import { KEYS, VALS, is_scalar, is_function, is_object, Svg } from './gum.js'

//
// jsx parser
//

// check if a function or class
function isClass(func) {
  return typeof func === 'function' &&
         func.prototype &&
         func.prototype.constructor === func &&
         Object.getOwnPropertyDescriptor(func, 'prototype').writable === false
}

function isWhitespace(s) {
  return typeof s === 'string' && s.replace(/\s/g, '') === ''
}

// recursively flatten all children, including nested arrays
function filterChildren(items) {
  return items.flat(1)
    .filter(item => item != null && item !== false && item !== true && !isWhitespace(item))
}

function convertKebab(props) {
  return (props != null) ? Object.fromEntries(
    Object.entries(props).map(
      ([ k, v ]) => [ k.replace(/-/g, '_'), v ]
    )
  ) : {}
}

function h(tag, props, ...children) {
  const flattened = children.length > 0 ? filterChildren(children) : null
  const props1 = { children: flattened, ...convertKebab(props) }
  return isClass(tag) ? new tag(props1) : tag(props1)
}

function trim_lines(s) {
  return s.split('\n')
          .map(l => l.trim())
          .join('\n')
}

// preserve newlines inside JSX
registerPlugin("preserve-jsx-whitespace", function ({ types: t }) {
  return {
      name: "preserve-jsx-whitespace",
      visitor: {
          JSXText(path) {
            const raw = trim_lines(path.node.value).replace(/\n+/g, '\n')
            path.replaceWith(t.JSXExpressionContainer(t.stringLiteral(raw)))
          },
      },
  }
})

function parseJSX(code) {
  // strip comment lines (to allow comments before bare elements)
  code = code.replace(/^\s*\/\/.*\n/gm, '').trim()

  // wrap code in a function if it's not an element
  const wrappedCode = /^\s*</.test(code) ? code : `function run() { ${code} }`

  // plugin based approach
  const react_jsx = [ 'transform-react-jsx', { pragma: 'h' } ]
  const plugins = [ 'preserve-jsx-whitespace', react_jsx ]
  const { code: transformed } = transform(wrappedCode, { plugins })

  // run that baby
  const runnable = `return ${transformed}`
  const executor = new Function('h', ...KEYS, runnable)
  const result = executor(h, ...VALS)

  // if its a function then run it
  return is_function(result) ? result() : result
}

//
// gum evaluator
//

class ErrorNoCode extends Error {
  constructor() {
    super('No code provided')
    this.name = 'ErrorNoCode'
  }
}

class ErrorNoReturn extends Error {
  constructor() {
    super('No return value')
    this.name = 'ErrorNoReturn'
  }
}

class ErrorReturn extends Error {
  constructor(value) {
    super('Return value')
    this.name = 'ErrorReturn'
    this.value = value
  }
}

function evaluateGum(code, args = {}) {
  if (code.trim() == '') {
    throw new ErrorNoCode()
  }

  // parse to property tree
  let element = parseJSX(code)

  // check if its actually a tree
  if (!is_object(element)) {
    if (element == null) {
      throw new ErrorNoReturn()
    } else {
      throw new ErrorReturn(element)
    }
  }

  // wrap it in Svg if not already
  if (!(element instanceof Svg)) {
    element = new Svg({ children: element, ...args })
  }

  // return element
  return element
}

function evaluateGumSafe(code, args = {}) {
  let svg, size, error = null
  try {
    const elem = evaluateGum(code, args)
    svg = elem.svg()
    size = elem.size
  } catch (err) {
    error = err
  }

  // return results
  return { svg, error, size }
}

//
// export
//

export { evaluateGum, evaluateGumSafe, ErrorNoCode, ErrorNoReturn, ErrorReturn }
