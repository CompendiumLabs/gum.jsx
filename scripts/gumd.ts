#!/usr/bin/env bun

// Gummy - Markdown pager with embedded gum.jsx visualizations

import { readFileSync } from 'fs'
import { program } from 'commander'
import { readStdin } from 'gum-jsx/render'
import { displayMarkdown } from '../src/lib/mark'

// set up commander
program.name('gummy')
  .description('Markdown pager with embedded gum.jsx visualizations')
  .argument('[file]', 'Markdown file to render (reads from stdin if not provided)')
  .option('-t, --theme <name>', 'Theme to use for gum.jsx', 'dark')
  .option('-s, --size <pixels>', 'Coordinate size for SVG', parseInt)
  .option('-w, --width <pixels>', 'Max width for gum blocks', parseInt)
  .option('-h, --height <pixels>', 'Max height for gum blocks', parseInt)
  .parse()

// parse arguments and options
const [file] = program.args
const opts = program.opts()

// read and render markdown
const content = file ? readFileSync(file, 'utf-8') : await readStdin()
const output = displayMarkdown(content, opts)
process.stdout.write(output)
