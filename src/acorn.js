import * as acorn from 'acorn'
import jsx from 'acorn-jsx'

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
      const cstring = children.map(walkTree).join(',\n')
      return `component(\n"${name}",\n${pstring},\n${cstring}\n)`
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

return <Box padding>
  <Rect rotate={y()} spin={30} />
</Box>
`.trim()

// dummy component
function component(name, props, ...children) {
  return { name, props, children }
}

//
// run test
//

// parse code
const wrappedCode = /^\s*</.test(code) ? code : `function run() { "use strict"; ${code} }`
const tree = parseJSX(wrappedCode)

// print tree
console.log(JSON.stringify(tree, null, 2))
console.log('--------------------------------')

// convert tree to code
const jsCode = walkTree(tree)

// print code
console.log(jsCode)
console.log('--------------------------------')

// execute code
const jsCode1 = `return ${jsCode}`
const func = new Function('component', jsCode1)
const output0 = func(component)
const output = (typeof(output0) == 'function') ? output0() : output0

// report output
console.log(JSON.stringify(output, null, 2))
