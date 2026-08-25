#! /usr/bin/env bun

import { join, basename } from 'path'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync } from 'fs'

import { evaluateGum } from '../src/eval'

const dataDir = 'docs/data'
function loadFile(path: string, encoding: string = 'utf8') {
    const file = join(dataDir, basename(path))
    return encoding == 'bytes'
        ? readFileSync(file)
        : readFileSync(file, encoding as BufferEncoding)
}

//
// run examples
//

type Theme = 'light' | 'dark'
const themes: Theme[] = ['light', 'dark']

type Render = {
    svg?: string
    error?: string
}

type Result = {
    group: string
    file: string
    path: string
    code: string
    renders: Record<Theme, Render>
}

const groups = ['docs', 'gala', 'test']
const report = process.argv.includes('--report')
const results: Result[] = []

// examples that deliberately exercise a permissive fallback opt out with a
// `@nostrict` comment
function allowsStrict(code: string): boolean {
    return !/@nostrict\b/.test(code)
}

// the strict render decides pass/fail: it turns the fallbacks that would
// otherwise draw something wrong (unparseable tex, unhandled katex nodes,
// unknown commands, missing glyphs) into thrown errors. On a strict failure we
// still do the permissive render, so the report shows what the document draws
// alongside the reason it failed
function render(code: string, theme: Theme): Render {
    const strict = allowsStrict(code)
    try {
        const elem = evaluateGum(code, { size: 1000, theme, strict, loadFile })
        return { svg: elem.svg() }
    } catch (e: any) {
        const { message = 'Unknown error' } = e
        if (!strict) return { error: message }
        try {
            const elem = evaluateGum(code, { size: 1000, theme, loadFile })
            return { svg: elem.svg(), error: message }
        } catch {
            return { error: message }
        }
    }
}

for (const group of groups) {
    const dir = join(group, 'code')
    const files = readdirSync(dir).filter(f => f.endsWith('.jsx')).sort()
    for (const file of files) {
        const path = join(dir, file)
        const code = readFileSync(path, 'utf-8')
        const renders = { light: render(code, 'light'), dark: render(code, 'dark') }
        const errors = themes.filter(t => renders[t].error != null)
        if (errors.length == 0) {
            console.log(`PASS ${path}`)
        } else {
            const detail = errors.map(t => `${t}: ${renders[t].error}`).join('; ')
            console.error(`FAIL ${path}: ${detail}`)
        }
        results.push({ group, file, path, code, renders })
    }
}

const isPass = (r: Result) => themes.every(t => r.renders[t].error == null)
const passed = results.filter(isPass).length
const failed = results.length - passed

//
// report data
//

// the svg files plus a manifest go in test/data; the viewer in test/report is a
// react app that reads them (see test/report/README.md)
const outDir = 'test/data'

type Entry = {
    id: string
    name: string
    group: string
    path: string
    code: string
    status: 'pass' | 'fail'
    renders: Record<Theme, { svg: string | null, error: string | null }>
}

type Manifest = {
    generated: string
    themes: Theme[]
    groups: string[]
    passed: number
    failed: number
    examples: Entry[]
}

// one svg file per example per theme (docs/light/Box.svg, ...) and a manifest
// listing what got written, with the source and any strict error alongside
function writeData() {
    rmSync(outDir, { recursive: true, force: true })
    for (const group of groups) {
        for (const theme of themes) mkdirSync(join(outDir, group, theme), { recursive: true })
    }

    const examples = results.map(result => {
        const { group, file, path, code, renders } = result
        const name = file.replace(/\.jsx$/, '')
        const entry: Entry = {
            id: `${group}/${name}`, name, group, path, code,
            status: isPass(result) ? 'pass' : 'fail',
            renders: { light: { svg: null, error: null }, dark: { svg: null, error: null } },
        }
        for (const theme of themes) {
            const { svg, error } = renders[theme]
            if (svg != null) {
                const rel = join(group, theme, `${name}.svg`)
                writeFileSync(join(outDir, rel), svg)
                entry.renders[theme].svg = rel
            }
            entry.renders[theme].error = error ?? null
        }
        return entry
    })

    const manifest: Manifest = {
        generated: new Date().toISOString(), themes, groups, passed, failed, examples,
    }
    writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2))
    console.error(`wrote ${examples.length} examples to ${outDir}`)
}

if (report) writeData()

console.log()
console.error(`${passed} passed`)
console.error(`${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
