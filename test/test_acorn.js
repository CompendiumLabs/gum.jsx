// test acorn jsx parser

import { runJSX } from '../src/acorn.js'
import { waitForStdin } from '../src/node.js'

// get code from stdin
const code = await waitForStdin()

// run parser in debug mode
const element = runJSX(code, true)
console.log(element)
