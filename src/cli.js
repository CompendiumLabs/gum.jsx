#! /usr/bin/env node

import { program } from 'commander'
import { waitForStdin } from './node.js'
import { evaluateGum } from './eval.js'
import { renderPng } from './render.js'

// get options from commander
program
  .option('-s, --size <size>', 'size of the image', (value) => parseInt(value), 500)
  .option('-x, --pixels <pixels>', 'svg pixel coords', (value) => parseInt(value), 500)
  .option('-f, --format <format>', 'format of the image', 'svg')
  .option('-t, --theme <theme>', 'theme to use', 'dark')
  .option('-b, --background <color>', 'background color', null)
  .parse()
const { size, pixels, format, theme, background } = program.opts()

// wait for stdin
const code = await waitForStdin()

// evaluate gum with size
const elem = evaluateGum(code, { size: pixels, theme })
const svg = elem.svg()

// output svg or png
if (format == 'png') {
  const png = renderPng(svg, { size, background })
  process.stdout.write(png)
} else if (format == 'svg') {
  process.stdout.write(svg)
} else {
  console.error(`Invalid format: ${format}`)
  process.exit(1)
}
