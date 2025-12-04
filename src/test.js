// test cli

import { program } from 'commander'
import { waitForStdin } from './node.js'
import { evaluateGum } from './eval.js'
import { setTheme } from './gum.js'

// get options from commander
program
  .option('-d, --debug', 'debug mode', false)
  .parse()
const { debug } = program.opts()
const code = await waitForStdin()

// run jsx
setTheme('dark')
const elem = evaluateGum(code, { debug, size: 1000 })
const svg = elem.svg()

// output result
console.log(svg)
