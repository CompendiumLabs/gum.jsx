#! /usr/bin/env bun

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Command } from 'commander'
import { getDocs } from './docs.js'

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

// parse arguments
const program = new Command()
program.option('-o, --output <output>', 'the output directory for the skill')
program.parse(process.argv)
const { output = 'skill' } = program.opts()

// load docs pages
const { cats, pages } = getDocs()

// load prompt files
const header = readFileSync('prompt/header.md', 'utf8').trim()
const prompt = readFileSync('prompt/intro.md', 'utf8').trim()
const docs = readFileSync('prompt/docs.md', 'utf8').trim()
const refsum = readFileSync('prompt/refs.md', 'utf8').trim()

// build skill file
const skill = `
${header}

${prompt}

${docs}

${pages.get('element')}

${pages.get('group')}

${pages.get('box')}

${refsum}
`.trim()

// write skill directory
mkdirSync(`${output}/references`, { recursive: true })
writeFileSync(`${output}/SKILL.md`, skill + '\n')
cats.forEach((ps, c) => {
    if (c == 'core') return
    const content = ps.map(p => pages.get(p)).join('\n\n')
    const entry = `# ${capitalize(c)} Elements\n\n${content}\n`
    writeFileSync(`${output}/references/${c}.md`, entry)
})
