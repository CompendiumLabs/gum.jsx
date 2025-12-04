import * as acorn from 'acorn'
import jsx from 'acorn-jsx'
import { ELEMS, KEYS, VALS } from './gum.js'

//
// parser utils
//

const parser = acorn.Parser.extend(jsx())
function parseJSX(code) {
  const tree = parser.parse(code, {
    ecmaVersion: 'latest',
    sourceType: 'module',
  })
  return tree
}

function objectLiteral(obj) {
  const body = Object.entries(obj).map(([ k, v ]) => `${k}: ${v}`)
  return `{ ${body.join(', ')} }`
}

function isWhitespace(s) {
  return (typeof s === 'string') && (s.replace(/\s/g, '') === '')
}

//
// tree walker
//

function walkTree(node) {
  if (node == null) return null

  const visitors = {
    Program(node) {
      const { body } = node
      return body.map(walkTree).join('\n')
    },
    Literal(node) {
      return node.raw
    },
    Identifier(node) {
      return node.name
    },
    VariableDeclarator(node) {
      const { id, init } = node
      return `${walkTree(id)} = ${walkTree(init)}`
    },
    VariableDeclaration(node) {
      const { kind, declarations } = node
      return `${kind} ${declarations.map(walkTree).join(', ')}`
    },
    BinaryExpression(node) {
      const { left, right, operator } = node
      return `(${walkTree(left)}) ${operator} (${walkTree(right)})`
    },
    FunctionDeclaration(node) {
      const { id, body } = node
      const name = walkTree(id)
      return `function ${name}() {\n${walkTree(body)}\n}`
    },
    BlockStatement(node) {
      const { body } = node
      return body.map(walkTree).join('\n')
    },
    ExpressionStatement(node) {
      const { expression } = node
      return walkTree(expression)
    },
    ReturnStatement(node) {
      const { argument } = node
      return `return (\n${walkTree(argument)}\n)`
    },
    CallExpression(node) {
      const { callee, arguments: args } = node
      return `${walkTree(callee)}(${args.map(walkTree).join(', ')})`
    },
    JSXIdentifier(node) {
      return node.name
    },
    JSXExpressionContainer(node) {
      const { expression } = node
      return walkTree(expression)
    },
    JSXElement(node) {
      const { openingElement, children } = node
      const { name, props } = walkTree(openingElement)
      const pstring = objectLiteral(props)
      const cstrings = children.map(walkTree).filter(c => c != null)
      return `component(\n"${name}",\n${pstring},\n${cstrings.join(',\n')}\n)`
    },
    JSXAttribute(node) {
      const { name, value } = node
      return [ walkTree(name), walkTree(value) ?? true ]
    },
    JSXMemberExpression(node) {},
    JSXNamespacedName(node) {},
    JSXOpeningElement(node) {
      const { name: nameId, attributes } = node
      const name = walkTree(nameId)
      const props = Object.fromEntries(attributes.map(walkTree))
      return { name, props }
    },
    JSXClosingElement(node) {},
    JSXFragment(node) {},
    JSXText(node) {
      if (isWhitespace(node.value)) return null
      return `${JSON.stringify(node.value)}`
    },
  }

  // get visitor type
  const { type } = node
  if (!(type in visitors)) {
    console.error(`Unknown node type: ${type}`)
    return null
  }

  // visit node
  return visitors[type](node)
}

//
// test code
//

// testing
const code = `
const x = 10
function y() {
  return x + 10
}

return <Svg size={100}>
  <Box padding>
    <Rect rounded rotate={y()} fill="#666" />
  </Box>
</Svg>
`.trim()

// dummy component
function component(name, props, ...children) {
  const maker = ELEMS[name]
  if (maker == null) throw new Error(`Unknown component: ${name}`)
  const cargs = children.length > 0 ? { children } : {}
  return new maker({ ...cargs, ...props })
}

//
// run test
//

function runJSX(code0) {
  // parse code
  const code = /^\s*</.test(code0) ? code0 : `function run() { "use strict"; ${code0} }`
  const tree = parseJSX(code)

  // print tree
  // console.log(JSON.stringify(tree, null, 2))
  // console.log('--------------------------------')

  // convert tree to code
  const jsCode0 = walkTree(tree)

  // print code
  // console.log(jsCode)
  // console.log('--------------------------------')

  // construct function
  const jsCode = `return ${jsCode0}`
  const func = new Function('component', ...KEYS, jsCode)

  // execute function
  const output0 = func(component, ...VALS)
  const output = (typeof(output0) == 'function') ? output0() : output0

  // print output
  // console.log(JSON.stringify(output, null, 2))
  // console.log('--------------------------------')

  // return gum object
  return output
}

// render svg
const obj = runJSX(code)
const svg = obj.svg()
console.log(svg)
