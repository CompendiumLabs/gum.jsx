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

// recursively flatten all children, including nested arrays
function flattenChildren(items) {
  const result = []
  for (const item of items) {
      if (Array.isArray(item)) {
        result.push(...flattenChildren(item))
      } else if (item != null && item !== false && item !== true) {
        if (typeof item === 'string' && item.replace(/\s/g, '') === '') continue
        result.push(item)
      }
  }
  return result
}

function convertKebab(props) {
  return (props != null) ? Object.fromEntries(
    Object.entries(props).map(
      ([ k, v ]) => [ k.replace(/-/g, '_'), v ]
    )
  ) : {}
}

function h(tag, props, ...children) {
  if (tag == 'br') return ''
  const flattened = children.length > 0 ? flattenChildren(children) : null
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
              const raw = trim_lines(path.node.value).replace(/\n+/g, '\n').trim()
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

function evaluateGum(code, { size = 500, debug = false } = {}) {
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
    let args = { size }
    if (!is_scalar(size)) {
      const [ width, height ] = size
      args.width = width
      args.height = height
    }
    element = new Svg({ children: element, debug, ...args })
  }

  // return element
  return element
}

function evaluateGumSafe(code, { size: size0 } = {}) {
  let svg, size, error = null
  try {
    const elem = evaluateGum(code, { size: size0 })
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
