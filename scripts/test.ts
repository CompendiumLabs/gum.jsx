#! /usr/bin/env bun

import { readdirSync, readFileSync } from 'fs'
import { join } from 'path'
import { evaluateGum } from '../src/eval.js'

const dirs = ['docs/code', 'docs/gala']
let passed = 0
let failed = 0

for (const dir of dirs) {
    const files = readdirSync(dir).filter(f => f.endsWith('.jsx')).sort()
    for (const file of files) {
        const path = join(dir, file)
        try {
            const code = readFileSync(path, 'utf-8')
            const elem = evaluateGum(code, { size: 500, theme: 'dark' })
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

console.log()
console.error(`${passed} passed`)
console.error(`${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
