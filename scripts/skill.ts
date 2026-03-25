#! /usr/bin/env bun

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Command } from 'commander'
import { getDocs, getGala, prepareDocsPage, prepareGalaPage } from '../src/meta'

// capitalize a string
function capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

// parse arguments
const program = new Command()
program.option('-o, --output <output>', 'the output directory for the skill')
program.parse(process.argv)
const { output = 'claude/skills/gum-jsx' } = program.opts()

// load docs pages
const { tags: docs_tags, cats, text: docs_text, code: docs_code } = getDocs('docs')
const { tags: gala_tags, text: gala_text, code: gala_code } = getGala('gala')

// make reference pages
const docs_pages = Object.fromEntries(docs_tags.map(tag =>
   [ tag, prepareDocsPage(docs_text[tag], docs_code[tag]) ]
))

const gala_pages = Object.fromEntries(gala_tags.map(tag =>
    [ tag, prepareGalaPage(gala_text[tag], gala_code[tag]) ]
))

// load prompt files
const head = readFileSync('prompt/head.md', 'utf8').trim()
const intro = readFileSync('prompt/intro.md', 'utf8').trim()
const docs = readFileSync('prompt/docs.md', 'utf8').trim()
const refs = readFileSync('prompt/refs.md', 'utf8').trim()
const gen = readFileSync('prompt/gen.md', 'utf8').trim()

// build skill file
const skill = `
${head}

${intro}

${docs}

${docs_pages['Element']}

${docs_pages['Group']}

${docs_pages['Box']}

${refs}

${gen}
`.trim()

// write skill directory
mkdirSync(output, { recursive: true })
writeFileSync(`${output}/SKILL.md`, skill + '\n')

// write reference pages
mkdirSync(`${output}/references`, { recursive: true })
Object.entries(cats).forEach(([c, ps]) => {
    if (c == 'core') return
    const content = ps.map(p => docs_pages[p]).join('\n\n')
    const entry = `# ${capitalize(c)} Elements\n\n${content}\n`
    writeFileSync(`${output}/references/${c}.md`, entry)
})

// write gala pages
mkdirSync(`${output}/references/gala`, { recursive: true })
gala_tags.forEach(t => {
    const entry = gala_pages[t]
    writeFileSync(`${output}/references/gala/${t}.md`, entry)
})
