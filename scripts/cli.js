#! /usr/bin/env bun

import { program } from 'commander'
import { evaluateGum } from '../src/eval.js'
import { rasterizeSvg, formatImage } from '../src/render.js'

// read from stdin
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

// get options from commander
program
  .option('-f, --format <format>', 'format to use', 'png')
  .option('-t, --theme <theme>', 'theme to use', 'dark')
  .option('-r, --raw', 'raw output', false)
  .option('-s, --size <size>', 'size of the image', (value) => parseInt(value), 500)
  .option('-w, --width <width>', 'width of the image', (value) => parseInt(value))
  .option('-h, --height <height>', 'height of the image', (value) => parseInt(value))
  .parse()
const { format, size, width, height, theme, raw } = program.opts()
const isPng = format == 'png'

// wait for stdin
const code = await readStdin()

// evaluate gum with size
const elem = evaluateGum(code, { size, theme })
const svg = elem.svg()

// rasterize output
const dat = isPng ? rasterizeSvg(svg, { size: elem.size, width, height }) : svg
const out = (isPng && !raw) ? formatImage(dat) : dat

// write output
process.stdout.write(out)
