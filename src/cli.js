#! /usr/bin/env node

import { program } from 'commander'
import { waitForStdin } from './node.js'
import { evaluateGum } from './eval.js'

// get options from commander
program
  .option('-s, --size <size>', 'size of the image', (value) => parseInt(value), 500)
  .option('-t, --theme <theme>', 'theme to use', 'dark')
  .parse()
const { size, theme } = program.opts()

// wait for stdin
const code = await waitForStdin()

// evaluate gum with size
const elem = evaluateGum(code, { size, theme })
const svg = elem.svg()

// output svg
process.stdout.write(svg)
