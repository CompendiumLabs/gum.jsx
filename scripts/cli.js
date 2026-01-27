#! /usr/bin/env bun

import { program } from 'commander'
import { evaluateGum } from '../src/eval.js'

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
  .option('-s, --size <size>', 'size of the image', (value) => parseInt(value), 500)
  .option('-t, --theme <theme>', 'theme to use', 'dark')
  .parse()
const { size, theme } = program.opts()

// wait for stdin
const code = await readStdin()

// evaluate gum with size
const elem = evaluateGum(code, { size, theme })
const svg = elem.svg()

// output svg
process.stdout.write(svg)
