#! /usr/bin/env bun

import { program } from 'commander'
import { evaluateGum } from '../src/eval.js'
import { rasterizeSvg } from '../src/render.js'
import { readStdin, formatImage, watchAndRender } from '../src/term.js'
import { readFileSync } from 'fs'

// set up commander
program.name('gum')
  .description('gum.jsx to SVG/PNG converter and viewer')
  .argument('[file]', 'gum.jsx file to render (reads from stdin if not provided)')
  .option('-f, --format <format>', 'format to output', 'png')
  .option('-t, --theme <theme>', 'theme to use', 'dark')
  .option('-u, --update', 'live update display', false)
  .option('-s, --size <size>', 'size of the SVG', (value) => parseInt(value), 500)
  .option('-w, --width <width>', 'width of the PNG', (value) => parseInt(value))
  .option('-h, --height <height>', 'height of the PNG', (value) => parseInt(value))
  .option('-r, --raw', 'raw output', false)
  .parse()

// parse arguments
const [file] = program.args
const { format, theme, update, size, width, height, raw } = program.opts()

// wait for stdin
const code = file ? readFileSync(file, 'utf-8') : await readStdin()

if (update) {
  watchAndRender(file, (content, imageId) => {
    const elem = evaluateGum(content, { size, theme })
    const svg = elem.svg()
    const dat = rasterizeSvg(svg, { size: elem.size, width, height })
    return formatImage(dat, { imageId })
  })
} else {
  // evaluate gum with size
  const elem = evaluateGum(code, { size, theme })
  const svg = elem.svg()

  // rasterize output
  const isPng = format == 'png'
  const dat = isPng ? rasterizeSvg(svg, { size: elem.size, width, height }) : svg
  const out = (isPng && !raw) ? formatImage(dat) : dat

  // write output
  process.stdout.write(out)
}
