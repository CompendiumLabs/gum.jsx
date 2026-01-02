// build docs JSON bundle

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// parse text file
function parseText(text0) {
    // replace links with bold text
    const text = text0.replace(/\[(.*?)\]\((.*?)\)/g, '**$1**').trim()

    // return text
    return { text }
}

// parse code file
function parseCode(code0) {
    // get prompt and code
    const [ first, ...rest ] = code0.split('\n')

    // check if valid
    if (!first.startsWith('//')) {
        throw new Error(`Invalid code file: ${code0}`)
    }

    // reconstruct prompt and code
    const prompt = first.slice(2).trim()
    const code = rest.join('\n').trim()

    // return prompt and code
    return { prompt, code }
}

// load metadata from docs/meta.json
const meta = JSON.parse(readFileSync('docs/meta.json', 'utf8'))
const tags = Object.values(meta).flat()

// collect all files in docs/skill
const refs = tags.map(tag => {
    const name = tag.toLowerCase()
    const { text } = parseText(readFileSync(`docs/text/${name}.md`, 'utf8'))
    const { prompt, code } = parseCode(readFileSync(`docs/code/${name}.jsx`, 'utf8'))
    const info = `
${text}

## Example

Prompt: ${prompt}

Generated code:
\`\`\`jsx
${code}
\`\`\`
    `.trim()
    return { tag, info }
})

// create src/docs
mkdirSync('skill/references', { recursive: true })

// write to skill/references
refs.forEach(({ tag, info }) => {
    writeFileSync(`skill/references/${tag}.md`, info + '\n')
})
