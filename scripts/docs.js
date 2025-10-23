// build docs JSON bundle

import { readdirSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'

// get tag from file name
function getTag(file) {
    const name = file.split('/').pop()
    return name.split('.')[0].toLowerCase()
}

// load metadata from docs/meta.json
const meta = JSON.parse(readFileSync('docs/meta.json', 'utf8'))

// load each file in docs/text
const text = Object.fromEntries(readdirSync('docs/text').map(
    file => [ getTag(file), readFileSync(`docs/text/${file}`, 'utf8') ]
))

// load each file in docs/code
const code = Object.fromEntries(readdirSync('docs/code').map(
    file => [ getTag(file), readFileSync(`docs/code/${file}`, 'utf8') ]
))

// create src/docs
mkdirSync('src/docs', { recursive: true })

// write to src/docs
writeFileSync('src/docs/meta.json', JSON.stringify(meta, null, 2))
writeFileSync('src/docs/text.json', JSON.stringify(text, null, 2))
writeFileSync('src/docs/code.json', JSON.stringify(code, null, 2))
