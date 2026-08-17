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

type Result = {
    dir: string
    file: string
    path: string
    code: string
    svg?: string
    error?: string
}

const dirs = ['docs/code', 'gala/code', 'test/code']
const report = process.argv.includes('--report')
const results: Result[] = []

for (const dir of dirs) {
    const files = readdirSync(dir).filter(f => f.endsWith('.jsx')).sort()
    for (const file of files) {
        const path = join(dir, file)
        const code = readFileSync(path, 'utf-8')
        try {
            const elem = evaluateGum(code, { size: 500, theme: 'dark', loadFile })
            const svg = elem.svg()
            console.log(`PASS ${path}`)
            results.push({ dir, file, path, code, svg })
        } catch (e: any) {
            const { message = 'Unknown error' } = e
            console.error(`FAIL ${path}: ${message}`)
            results.push({ dir, file, path, code, error: message })
        }
    }
}

const passed = results.filter(r => r.error == null).length
const failed = results.length - passed

//
// html report
//

const reportDir = 'test/report'
const templatePath = 'test/template.html'

function escapeHtml(s: string): string {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
}

function makeCard(result: Result): string {
    const { dir, file, code, svg, error } = result
    const name = file.replace(/\.jsx$/, '')
    const status = error == null ? 'pass' : 'fail'
    const body = error == null
        ? `<div class="image"><img src="${dir}/${name}.svg" loading="lazy"></div>`
        : `<div class="error">${escapeHtml(error ?? '')}</div>`
    return `<div class="card ${status}">
  <div class="head"><span class="name">${escapeHtml(file)}</span><span class="status ${status}">${status.toUpperCase()}</span></div>
  ${body}
  <details><summary>code</summary><pre>${escapeHtml(code.trim())}</pre></details>
</div>`
}

function makeSection(dir: string, items: Result[]): string {
    const cards = items.map(makeCard).join('\n')
    return `<h2>${escapeHtml(dir)}</h2>\n<div class="grid">\n${cards}\n</div>`
}

function writeReport() {
    // write rendered svg files
    for (const result of results) {
        const { dir, file, svg } = result
        if (svg == null) continue
        const outDir = join(reportDir, dir)
        mkdirSync(outDir, { recursive: true })
        writeFileSync(join(outDir, file.replace(/\.jsx$/, '.svg')), svg)
    }

    // fill in template
    const summary = `<span class="pass">${passed} passed</span>, ` +
        `<span class="fail">${failed} failed</span> &mdash; ${new Date().toLocaleString()}`
    const sections = dirs
        .map(dir => makeSection(dir, results.filter(r => r.dir == dir)))
        .join('\n')
    const template = readFileSync(templatePath, 'utf-8')
    const html = template
        .replace('{{summary}}', summary)
        .replace('{{sections}}', sections)

    // write index page
    writeFileSync(join(reportDir, 'index.html'), html)
    console.error(`report written to ${join(reportDir, 'index.html')}`)
}

if (report) {
    rmSync(reportDir, { recursive: true, force: true })
    mkdirSync(reportDir, { recursive: true })
    writeReport()
}

console.log()
console.error(`${passed} passed`)
console.error(`${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
