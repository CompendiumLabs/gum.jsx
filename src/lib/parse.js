// acorn jsx parser

import * as acorn from 'acorn'
import jsx from 'acorn-jsx'

import { CONTEXT } from '../gum.js'

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
  const body = obj.map(({ key, value, spread }) =>
    spread? `...${spread}` : `${key}: ${value}`
  )
  return `{ ${body.join(', ')} }`
}

function isWhitespace(s) {
  return (typeof s === 'string') && (s.replace(/\s/g, '') === '')
}

function isClass(func) {
  return (typeof func === 'function') &&
         (func.prototype != null) &&
         (func.prototype.constructor === func) &&
         (Object.getOwnPropertyDescriptor(func, 'prototype').writable === false)
}

function snakeCase(s) {
  return s.replace(/-/g, '_')
}

function filterChildren(items) {
  return items.flat(1)
    .filter(item => (item != null) && (item !== false) && (item !== true) && !isWhitespace(item))
}

function collateTemplate(expressions, quasis) {
  const exps = expressions.map(e => {
    const { start } = e
    const value = `\${${walkTree(e)}}`
    return { start, value }
  })
  const quas = quasis.map(e => {
    const { start } = e
    const value = walkTree(e)
    return { start, value }
  })
  return [...exps, ...quas]
    .sort((a, b) => a.start - b.start)
    .map(item => item.value)
}

//
// tree walker
//

const handlers = {
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
  UnaryExpression(node) {
    const { operator, argument } = node
    return `${operator}(${walkTree(argument)})`
  },
  BinaryExpression(node) {
    const { left, right, operator } = node
    return `(${walkTree(left)}) ${operator} (${walkTree(right)})`
  },
  ArrayExpression(node) {
    const { elements } = node
    return `[${elements.map(walkTree).join(', ')}]`
  },
  Property(node) {
    const { key, value } = node
    return `${walkTree(key)}: ${walkTree(value)}`
  },
  RestElement(node) {
    const { argument } = node
    return `...${walkTree(argument)}`
  },
  SpreadElement(node) {
    const { argument } = node
    return `...${walkTree(argument)}`
  },
  ObjectExpression(node) {
    const { properties } = node
    return `{ ${properties.map(walkTree).join(', ')} }`
  },
  MemberExpression(node) {
    const { object, property, computed } = node
    const obj = walkTree(object)
    const prop = walkTree(property)
    return computed ? `${obj}[${prop}]` : `${obj}.${prop}`
  },
  FunctionDeclaration(node) {
    const { id, body } = node
    const name = walkTree(id)
    return `function ${name}() {\n${walkTree(body)}\n}`
  },
  FunctionExpression(node) {
    const { params, body } = node
    return `(${params.map(walkTree).join(', ')}) {\n${walkTree(body)}\n}`
  },
  ArrowFunctionExpression(node) {
    const { params, body } = node
    return `(${params.map(walkTree).join(', ')}) => ${walkTree(body)}`
  },
  ConditionalExpression(node) {
    const { test, consequent, alternate } = node
    return `(${walkTree(test)}) ? ${walkTree(consequent)} : ${walkTree(alternate)}`
  },
  Super(node) {
    return 'super'
  },
  ThisExpression(node) {
    return 'this'
  },
  AssignmentExpression(node) {
    const { left, right } = node
    return `${walkTree(left)} = ${walkTree(right)}`
  },
  NewExpression(node) {
    const { callee, arguments: args } = node
    return `new ${walkTree(callee)}(${args.map(walkTree).join(', ')})`
  },
  ArrayPattern(node) {
    const { elements } = node
    return `[${elements.map(walkTree).join(', ')}]`
  },
  ObjectPattern(node) {
    const { properties } = node
    return `{ ${properties.map(walkTree).join(', ')} }`
  },
  AssignmentPattern(node) {
    const { left, right } = node
    return `${walkTree(left)} = ${walkTree(right)}`
  },
  TemplateLiteral(node) {
    const { quasis, expressions } = node
    const items = collateTemplate(expressions, quasis)
    return `\`${items.join('')}\``
  },
  TemplateElement(node) {
    const { value } = node
    const { cooked } = value
    return cooked
  },
  BlockStatement(node) {
    const { body } = node
    return `{\n${body.map(walkTree).join('\n')}\n}`
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
  ClassDeclaration(node) {
    const { id, superClass, body } = node
    const name = walkTree(id)
    const sup = superClass != null ? ` extends ${walkTree(superClass)}` : ''
    return `class ${name}${sup} {\n${walkTree(body)}\n}`
  },
  ClassBody(node) {
    const { body } = node
    return body.map(walkTree).join('\n')
  },
  MethodDefinition(node) {
    const { key, value } = node
    return `${walkTree(key)}${walkTree(value)}`
  },
  JSXIdentifier(node) {
    return node.name
  },
  JSXEmptyExpression(node) {
    return null
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
    return `__COMPONENT__(\n${name},\n${pstring},\n${cstrings.join(',\n')}\n)`
  },
  JSXAttribute(node) {
    const { name, value } = node
    return {
      key: snakeCase(walkTree(name)),
      value: walkTree(value) ?? true
    }
  },
  JSXMemberExpression(node) {},
  JSXNamespacedName(node) {},
  JSXOpeningElement(node) {
    const { name: nameId, attributes } = node
    const name = walkTree(nameId)
    const props = attributes.map(walkTree)
    return { name, props }
  },
  JSXClosingElement(node) {},
  JSXFragment(node) {},
  JSXText(node) {
    if (isWhitespace(node.value)) return null
    return `${JSON.stringify(node.value)}`
  },
  JSXSpreadAttribute(node) {
    const { argument } = node
    return {
      spread: walkTree(argument)
    }
  },
}

function walkTree(node) {
  if (node == null) return null

  // get handler function
  const { type } = node
  const handler = handlers[type]

  // check for error
  if (handler == null) throw new Error(`Unknown node type: ${type}`)

  // handle node
  return handler(node)
}

//
// gum runner
//

function component(klass, props, ...children0) {
  const children = filterChildren(children0)
  const args = children.length > 0 ? { children, ...props } : props
  return isClass(klass) ? new klass(args) : klass(args)
}

function runJSX(text, debug = false) {
  // strip comment lines (to allow comments before bare elements)
  const code0 = text.replace(/^\s*\/\/.*\n/gm, '').trim()

  // parse code
  const code = /^\s*</.test(code0) ? code0 : `function run() { "use strict"; ${code0} }`
  const tree = parseJSX(code)

  if (debug) {
    console.log('------------TREE----------------')
    console.log(JSON.stringify(tree, null, 2))
    console.log('--------------------------------')
    console.log()
  }

  // convert tree
  const jsCode0 = walkTree(tree)

  if (debug) {
    console.log('-------------JS-----------------')
    console.log(jsCode0)
    console.log('--------------------------------')
    console.log()
  }

  // construct function
  const jsCode = `return ${jsCode0}`
  const func = new Function('__COMPONENT__', ...Object.keys(CONTEXT), jsCode)

  // execute function
  const output0 = func(component, ...Object.values(CONTEXT))
  const output = typeof(output0) == 'function' ? output0() : output0

  // return gum object
  return output
}

export { runJSX }
