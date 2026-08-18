#! /usr/bin/env bun

import { join, basename, dirname } from 'path'
import { readdirSync, readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from 'fs'

import { createHighlighter } from 'shiki'

import { evaluateGum } from '../src/eval'
import { FONT_PATHS } from '../src/fonts/fonts'
import { light, regular, bold } from '../src/lib/const'

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
    dir: string
    file: string
    path: string
    code: string
    renders: Record<Theme, Render>
}

const dirs = ['docs/code', 'gala/code', 'test/code']
const report = process.argv.includes('--report')
const results: Result[] = []

function render(code: string, theme: Theme): Render {
    try {
        const elem = evaluateGum(code, { size: 500, theme, loadFile })
        return { svg: elem.svg() }
    } catch (e: any) {
        const { message = 'Unknown error' } = e
        return { error: message }
    }
}

for (const dir of dirs) {
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
        results.push({ dir, file, path, code, renders })
    }
}

const isPass = (r: Result) => themes.every(t => r.renders[t].error == null)
const passed = results.filter(isPass).length
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

// bundle the fonts the svg output references (same registry the rasterizer uses)
// and emit @font-face rules for them
function writeFonts(): string {
    const fontDir = join(reportDir, 'fonts')
    mkdirSync(fontDir, { recursive: true })
    const rules: string[] = []
    const addFace = (family: string, path: string, weight?: number) => {
        const file = basename(path)
        copyFileSync(path, join(fontDir, file))
        const weightRule = weight != null ? ` font-weight: ${weight};` : ''
        rules.push(`@font-face { font-family: "${family}"; src: url("fonts/${file}");${weightRule} }`)
    }
    for (const [ family, path ] of Object.entries(FONT_PATHS)) {
        if (typeof path == 'string') {
            addFace(family, path)
        } else {
            addFace(family, path.light, light)
            addFace(family, path.regular, regular)
            addFace(family, path.bold, bold)
        }
    }
    return rules.join('\n')
}

// syntax highlighting is done at build time; shiki's dual-theme output carries
// both palettes as css variables, so the page's theme toggle selects one
type Highlight = (code: string) => string

async function makeHighlighter(): Promise<Highlight> {
    const highlighter = await createHighlighter({ langs: ['jsx'], themes: ['github-light', 'github-dark'] })
    return (code: string) => highlighter.codeToHtml(code, {
        lang: 'jsx',
        themes: { light: 'github-light', dark: 'github-dark' },
        defaultColor: false,
    })
}

// svg files are written standalone for inspection, but inlined into the page
// so they can use the page's @font-face declarations; both themes are inlined
// and the page toggle picks which one is visible. Code is kept in an inert
// template until the card is opened in the shared example dialog.
function makeCard(result: Result, highlight: Highlight): string {
    const { file, code, renders } = result
    const status = isPass(result) ? 'pass' : 'fail'
    const images = themes.map(theme => {
        const { svg, error } = renders[theme]
        const inner = error == null ? svg : `<div class="error">${escapeHtml(error ?? '')}</div>`
        return `<div class="image theme-${theme}">${inner}</div>`
    }).join('\n  ')
    return `<article class="card ${status}" tabindex="0" role="button" aria-haspopup="dialog">
  <div class="head">
    <span class="name">${escapeHtml(file)}</span>
    <span class="status ${status}">${status.toUpperCase()}</span>
  </div>
  <div class="card-view">
  ${images}
  </div>
  <template class="code-template">${highlight(code.trim())}</template>
</article>`
}

function makeSection(dir: string, items: Result[], highlight: Highlight): string {
    const cards = items.map(item => makeCard(item, highlight)).join('\n')
    return `<h2 id="${escapeHtml(dir)}">${escapeHtml(dir)}</h2>\n<div class="grid">\n${cards}\n</div>`
}

async function writeReport() {
    // write rendered svg files, one subdirectory per theme (docs/light, docs/dark, ...)
    for (const result of results) {
        const { dir, file, renders } = result
        for (const theme of themes) {
            const { svg } = renders[theme]
            if (svg == null) continue
            const outDir = join(reportDir, dirname(dir), theme)
            mkdirSync(outDir, { recursive: true })
            writeFileSync(join(outDir, file.replace(/\.jsx$/, '.svg')), svg)
        }
    }

    // fill in template
    const fonts = writeFonts()
    const highlight = await makeHighlighter()
    const summary = `<span class="pass">${passed} passed</span>, ` +
        `<span class="fail">${failed} failed</span> &mdash; ${new Date().toLocaleString()}`
    const sections = dirs
        .map(dir => makeSection(dir, results.filter(r => r.dir == dir), highlight))
        .join('\n')
    const template = readFileSync(templatePath, 'utf-8')
    const html = template
        .replace('{{fonts}}', fonts)
        .replace('{{summary}}', summary)
        .replace('{{sections}}', sections)

    // write index page
    writeFileSync(join(reportDir, 'index.html'), html)
    console.error(`report written to ${join(reportDir, 'index.html')}`)
}

if (report) {
    rmSync(reportDir, { recursive: true, force: true })
    mkdirSync(reportDir, { recursive: true })
    await writeReport()
}

console.log()
console.error(`${passed} passed`)
console.error(`${failed} failed`)
process.exit(failed > 0 ? 1 : 0)
