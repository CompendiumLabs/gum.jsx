#! /usr/bin/env bun

import { mkdirSync, readFileSync, writeFileSync } from 'fs'
import { Command } from 'commander'
import { getDocs } from '../src/meta.js'

// parse arguments
const program = new Command()
program.option('-o, --output <output>', 'the output directory for the skill')
program.parse(process.argv)
const { output = 'skill' } = program.opts()

//
// utility functions
//

function capitalize(s) {
    return s.charAt(0).toUpperCase() + s.slice(1)
}

// replace links with bold and push headings
function prepareText(text) {
    const mark = text
        .replace(/\[(.*?)\]\((.*?)\)/g, '**$1**') // links to bold
        .replace(/^# (.*?)$/mg, '## $1') // headings to bold
    return mark.trim()
}

// if there's a comment on line one, that's the query
function prepareCode(text) {
    const [ first, ...rest ] = text.split('\n')
    const query = first.replace(/^\/\/(.*?)$/, '$1').trim()
    const code = `\`\`\`jsx\n${rest.join('\n').trim()}\n\`\`\``
    return `**Example**\n\nPrompt: ${query}\n\nGenerated code:\n${code}`
}

//
// main function
//

// load docs pages
const { tags, cats, text, code } = getDocs('docs')

// make reference pages
const pages = Object.fromEntries(tags.map(tag =>
   [ tag, `${prepareText(text[tag])}\n\n${prepareCode(code[tag])}` ]
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
