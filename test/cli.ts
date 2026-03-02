#! /usr/bin/env bun

import { writeFileSync } from 'fs'
import path from 'path'
import { spawnSync } from 'child_process'
import { fileURLToPath } from 'url'
import { Command } from 'commander'
import { Svg, Box } from '../src/gum'
import { formatImage } from '../src/render'
import { parse_katex } from './katex'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(__dirname, '..')
const RESVG_RESOURCES_DIR = projectRoot
const RESVG_FONTS_DIR = path.join(projectRoot, 'node_modules', 'katex', 'dist', 'fonts')

function convertSvgToPng(svg: string, outputPath?: string, background?: string): Buffer {
    const args = [
        '--use-fonts-dir',
        RESVG_FONTS_DIR,
        '--resources-dir',
        RESVG_RESOURCES_DIR,
    ]

    if (background != null) {
        args.push('--background', background)
    }

    args.push('-')
    args.push(outputPath ?? '-c')

    const result = spawnSync('resvg', args, {
        input: svg,
        stdio: outputPath ? ['pipe', 'inherit', 'inherit'] : ['pipe', 'pipe', 'inherit'],
    })

    if (result.error) {
        throw result.error
    }

    if (result.status !== 0) {
        throw new Error(`resvg exited with status ${result.status}`)
    }

    if (!outputPath) {
        return result.stdout instanceof Buffer ? result.stdout : Buffer.alloc(0)
    }

    return Buffer.alloc(0)
}

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
    .description('Render TeX from stdin using test/katex.ts and output SVG/PNG')
    .option('-o, --output <output>', 'output file; defaults to stdout')
    .option('-p, --png', 'emit PNG (via resvg) instead of SVG')
    .option('-b, --background <color>', 'background color (PNG)', '#ffffff')
    .option('-s, --size <size>', 'svg size in px', (value) => parseInt(value), 500)
    .parse(process.argv)

const { output, png, size, background } = program.opts<{ output?: string, png?: boolean, size: number, background?: string }>()
const stdoutIsTTY = process.stdout.isTTY === true
const tex = await read_stdin()

if (tex.trim().length == 0) {
    throw new Error('No TeX input found on stdin')
}

const elem = parse_katex(tex)
if (elem == null) {
    throw new Error('Failed to parse TeX input')
}

const box = new Box({ children: [ elem ], padding: 0.1 })
const out = new Svg({ children: [ box ], size }).svg()

if (png) {
    const pngBuffer = convertSvgToPng(out, output, background)
    if (!output) {
        const outputData = stdoutIsTTY ? (formatImage(pngBuffer) + '\n') : pngBuffer
        process.stdout.write(outputData)
    }
} else {
    if (output) {
        writeFileSync(output, out)
    } else {
        process.stdout.write(out)
    }
}
