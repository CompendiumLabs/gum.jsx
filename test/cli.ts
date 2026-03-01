#! /usr/bin/env bun

import { writeFileSync } from 'fs'
import { Command } from 'commander'
import { Svg } from '../src/gum'
import { parse_katex } from './katex'

// read full stdin as utf-8
async function read_stdin(): Promise<string> {
    const chunks: Buffer[] = []
    for await (const chunk of process.stdin) {
        chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf-8')
}

// parse cli args
const program = new Command()
program
    .name('katex-test')
    .description('Render TeX from stdin using test/katex.ts and output SVG')
    .option('-o, --output <output>', 'output svg file')
    .option('-s, --size <size>', 'svg size in px', (value) => parseInt(value), 500)
    .parse(process.argv)

const { output, size } = program.opts<{ output?: string, size: number }>()
const tex = await read_stdin()

if (tex.trim().length == 0) {
    throw new Error('No TeX input found on stdin')
}

const elem = parse_katex(tex)
if (elem == null) {
    throw new Error('Failed to parse TeX input')
}

const out = new Svg({ children: [ elem ], size }).svg()
if (output) {
    writeFileSync(output, out)
} else {
    process.stdout.write(out)
}
