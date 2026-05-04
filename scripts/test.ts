#! /usr/bin/env bun

import { join, basename } from 'path'
import { readdirSync, readFileSync } from 'fs'

import { evaluateGum } from '../src/eval'

const dataDir = 'docs/data'
function loadFile(path: string, encoding: string = 'utf8') {
    const file = join(dataDir, basename(path))
    return encoding == 'bytes'
        ? readFileSync(file)
        : readFileSync(file, encoding as BufferEncoding)
}

function matchNumbers(text: string, pattern: RegExp, message: string): number[] {
    const match = text.match(pattern)
    if (match == null) throw new Error(message)
    return match.slice(1).map(Number)
}

function rotatePoint([ x, y ]: number[], angle: number, [ cx, cy ]: number[]): number[] {
    const theta = angle * Math.PI / 180
    const [ dx, dy ] = [ x - cx, y - cy ]
    const [ COS, SIN ] = [ Math.cos(theta), Math.sin(theta) ]
    return [ cx + dx * COS - dy * SIN, cy + dx * SIN + dy * COS ]
}

function midpoint(p0: number[], p1: number[]): number[] {
    return [ (p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2 ]
}

function dot(p0: number[], p1: number[]): number {
    return p0[0] * p1[0] + p0[1] * p1[1]
}

function assertGraphArrowHeadForward(svg: string) {
    const line = matchNumbers(svg, /<line x1="([-\d.]+)" y1="([-\d.]+)" x2="([-\d.]+)" y2="([-\d.]+)"/, 'Missing arrow shaft')
    const path = matchNumbers(svg, /<path d="M ([-\d.]+),([-\d.]+) L ([-\d.]+),([-\d.]+) M [-\d.]+,[-\d.]+ L ([-\d.]+),([-\d.]+)"/, 'Missing arrow head')
    const rotate = matchNumbers(svg, /transform="rotate\(([-\d.]+), ([-\d.]+), ([-\d.]+)\)"/, 'Missing arrow head transform')

    const [ x1, y1, x2, y2 ] = line
    const [ tipx, tipy, base0x, base0y, base1x, base1y ] = path
    const [ angle, cx, cy ] = rotate
    const center = [ cx, cy ]
    const tip = rotatePoint([ tipx, tipy ], angle, center)
    const base = midpoint(
        rotatePoint([ base0x, base0y ], angle, center),
        rotatePoint([ base1x, base1y ], angle, center),
    )
    const shaft = [ x2 - x1, y2 - y1 ]
    const head = [ tip[0] - base[0], tip[1] - base[1] ]
    if (dot(shaft, head) <= 0) throw new Error('Arrow head points opposite the shaft')
}

function assertRoundedLineCornerCircular(svg: string) {
    const [ rx, ry ] = matchNumbers(svg, /<path d="[^"]* A ([-\d.]+),([-\d.]+) /, 'Missing rounded corner arc')
    if (Math.abs(rx - ry) > 1e-6) throw new Error(`RoundedLine corner arc is skewed: ${rx},${ry}`)
}

const dirs = ['docs/code', 'gala/code']
let passed = 0
let failed = 0

for (const dir of dirs) {
    const files = readdirSync(dir).filter(f => f.endsWith('.jsx')).sort()
    for (const file of files) {
        const path = join(dir, file)
        try {
            const code = readFileSync(path, 'utf-8')
            const elem = evaluateGum(code, { size: 500, theme: 'dark', loadFile })
            console.log(`PASS ${path}`)
            elem.svg()
            passed++
        } catch (e: any) {
            const { message = 'Unknown error' } = e
            console.error(`FAIL ${path}: ${message}`)
            failed++
        }
    }
}

try {
    const code = '<Frame aspect={1.2}><Graph coord={[0, 0, 1, 1]}><Arrow points={[[0.25, 0.25], [0.75, 0.75]]} /></Graph></Frame>'
    const elem = evaluateGum(code, { size: 500, theme: 'dark', loadFile })
    assertGraphArrowHeadForward(elem.svg())
    console.log('PASS regression Graph Arrow wide aspect')
    passed++
} catch (e: any) {
    const { message = 'Unknown error' } = e
    console.error(`FAIL regression Graph Arrow wide aspect: ${message}`)
    failed++
}

try {
    const code = '<Frame aspect={4}><RoundedLine points={[[0.1,0.2],[0.5,0.2],[0.5,0.8]]} radius={0.1} /></Frame>'
    const elem = evaluateGum(code, { size: 500, theme: 'dark', loadFile })
    assertRoundedLineCornerCircular(elem.svg())
    console.log('PASS regression RoundedLine circular corners')
    passed++
} catch (e: any) {
    const { message = 'Unknown error' } = e
    console.error(`FAIL regression RoundedLine circular corners: ${message}`)
    failed++
}

console.log()
console.error(`${passed} passed`)
console.error(`${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
