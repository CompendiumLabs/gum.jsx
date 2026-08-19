#! /usr/bin/env bun

// Render Markdown (with embedded gum.jsx, images, and TeX math) in a kitty terminal

import { Command } from 'commander'
import { readFileSync } from 'fs'

import { displayMarkdown } from '../src/mark'
import { readStdin } from '../src/render'

// main program

const program = new Command()
program.name('gum-down')
  .description('Markdown pager with embedded gum.jsx visualizations')
  .argument('[file]', 'Markdown file to render (reads from stdin if not provided)')
  .option('-t, --theme <theme>', 'theme to use for gum.jsx and math: light or dark', 'dark')
  .option('-w, --width <pixels>', 'max width for gum blocks and math', (value: string) => parseInt(value))
  .option('-H, --height <pixels>', 'max height for gum blocks and math', (value: string) => parseInt(value))
  .action(async function(this: Command) {
    const [ file ] = this.args
    const opts = this.opts()
    const content = file ? readFileSync(file, 'utf-8') : await readStdin()
    const output = displayMarkdown(content, opts)
    process.stdout.write(output)
  })
program.parse()
