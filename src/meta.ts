// generate system prompt

import { readFileSync, readdirSync } from 'fs'

// replace links with bold and push headings
function prepareText(text: string): string {
    const mark = text
        .replace(/\[(.*?)\]\((.*?)\)/g, '**$1**') // links to bold
        .replace(/^# (.*?)$/mg, '## $1') // headings to bold
    return mark.trim()
}

// if there's a comment on line one, that's the query
function prepareCode(text: string): string {
    const [ first, ...rest ] = text.split('\n')
    const query = first.replace(/^\/\/(.*?)$/, '$1').trim()
    const code = `\`\`\`jsx\n${rest.join('\n').trim()}\n\`\`\``
    return `**Example**\n\nPrompt: ${query}\n\nGenerated code:\n${code}`
}

function preparePage(text: string, code: string): string {
    return `${prepareText(text)}\n\n${prepareCode(code)}`
}

// index directory contents
function indexDirectory(dir: string): Record<string, string> {
    return Object.fromEntries(readdirSync(dir).map(
        file => [ file.split('.')[0], readFileSync(`${dir}/${file}`, 'utf8').trim() ]
    ))
}

interface DocsInfo {
    tags: string[],
    cats: Record<string, string[]>,
    text: Record<string, string>,
    code: Record<string, string>,
}

// make doc pages
function getDocs(docs_dir: string): DocsInfo {
    // load metadata
    const cats: Record<string, string[]> = JSON.parse(readFileSync(`${docs_dir}/meta.json`, 'utf8'))
    const tags = Object.values(cats).flat()

    // load text/code
    const text = indexDirectory(`${docs_dir}/text`)
    const code = indexDirectory(`${docs_dir}/code`)

    // return all docs info
    return { tags, cats, text, code }
}

interface GalaInfo {
    tags: string[],
    text: Record<string, string>,
    code: Record<string, string>,
}

// make gala pages
function getGala(gala_dir: string): GalaInfo {
    // load metadata
    const tags: string[] = JSON.parse(readFileSync(`${gala_dir}/meta.json`, 'utf8'))

    // load text/code
    const text = indexDirectory(`${gala_dir}/text`)
    const code = indexDirectory(`${gala_dir}/code`)

    // return all gala info
    return { tags, text, code }
}

export { getDocs, getGala, preparePage }
