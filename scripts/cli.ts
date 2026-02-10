#! /usr/bin/env bun

import { program } from 'commander'
import { evaluateGum } from '../src/eval.js'
import { rasterizeSvg, formatImage } from '../src/render.js'
import { readStdin, watchAndRender } from '../src/lib/term.js'
import { readFileSync, writeFileSync } from 'fs'

// set up commander
program.name('gum')
  .description('gum.jsx to SVG/PNG converter and viewer')
  .argument('[file]', 'gum.jsx file to render (reads from stdin if not provided)')
  .option('-f, --format <format>', 'format to output')
  .option('-o, --output <output>', 'output file')
  .option('-t, --theme <theme>', 'theme to use', 'dark')
  .option('-b, --background <background>', 'background color')
  .option('-u, --update', 'live update display', false)
  .option('-s, --size <size>', 'size of the SVG', (value) => parseInt(value), 500)
  .option('-w, --width <width>', 'width of the PNG', (value) => parseInt(value))
  .option('-h, --height <height>', 'height of the PNG', (value) => parseInt(value))
  .parse()

// parse arguments
const [file] = program.args
let { format, output, theme, background, update, size, width, height } = program.opts()

// don't output kitty to file
if (output && format == null) format = 'png'

// wait for stdin
const code = file ? readFileSync(file, 'utf-8') : await readStdin()

if (update) {
  watchAndRender(file, (content, imageId) => {
    const elem = evaluateGum(content, { size, theme })
    const svg = elem.svg()
    const dat = rasterizeSvg(svg, { size: elem.size, width, height, background })
    return formatImage(dat, { imageId })
  })
} else {
  // evaluate gum with size
  const elem = evaluateGum(code, { size, theme })
  const svg = elem.svg()

  // rasterize output
  let out: string | Buffer
  if (format == null || format == 'png') {
    const dat = rasterizeSvg(svg, { size: elem.size, width, height, background })
    out = formatImage(dat) + '\n'
  } else {
    out = svg
  }

  // write output
  if (output) {
    writeFileSync(output, out)
  } else {
    process.stdout.write(out)
  }
}
