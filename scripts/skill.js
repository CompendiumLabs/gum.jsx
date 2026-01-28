#! /usr/bin/env bun

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Command } from 'commander'
import { getDocs, preparePage } from '../src/meta.js'

// capitalize a string
function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

// parse arguments
const program = new Command()
program.option('-o, --output <output>', 'the output directory for the skill')
program.parse(process.argv)
const { output = 'skill' } = program.opts()

// load docs pages
const { tags, cats, text, code } = getDocs('docs')

// make reference pages
const pages = Object.fromEntries(tags.map(tag =>
   [ tag, preparePage(text[tag], code[tag]) ]
))

// load prompt files
const head = readFileSync('prompt/head.md', 'utf8').trim()
const intro = readFileSync('prompt/intro.md', 'utf8').trim()
const docs = readFileSync('prompt/docs.md', 'utf8').trim()
const refs = readFileSync('prompt/refs.md', 'utf8').trim()

// build skill file
const skill = `
${head}

${intro}

${docs}

${pages['element']}

${pages['group']}

${pages['box']}

${refs}
`.trim()

// write skill directory
mkdirSync(`${output}/references`, { recursive: true })
writeFileSync(`${output}/SKILL.md`, skill + '\n')
Object.entries(cats).forEach(([c, ps]) => {
    if (c == 'core') return
    const content = ps.map(p => pages[p]).join('\n\n')
    const entry = `# ${capitalize(c)} Elements\n\n${content}\n`
    writeFileSync(`${output}/references/${c}.md`, entry)
})
