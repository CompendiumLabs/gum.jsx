// gum cli

import { program } from 'commander'
import { evaluateGum } from './eval.js'
import { canvas } from './canvas.js'

// wait for stdin
function waitForStdin() {
  return new Promise((resolve) => {
      process.stdin.setEncoding('utf8');
      process.stdin.once('data', (data) => {
          resolve(data.trim());
      });
  });
}

// get options from commander
program
  .option('-s, --size <size>', 'size of the image', (value) => parseInt(value), 1000)
  .option('-t, --type <type>', 'type of the image', 'png')
  .option('-b, --background <color>', 'background color', null)
  .parse()
const { size: size0, type, background } = program.opts()

// wait for stdin
const code = await waitForStdin()
if (code.length == 0) {
  console.error('No code provided')
  process.exit(1)
}

// evaluate gum with size
const elem = evaluateGum(code, { size: size0, dims: true })
const svg = elem.svg()
const { size } = elem

// output svg or png
if (type == 'png') {
  const png = await canvas.renderPng(svg, { size, background })
  process.stdout.write(png)
} else if (type == 'svg') {
  process.stdout.write(svg)
} else {
  console.error(`Invalid type: ${type}`)
  process.exit(1)
}
