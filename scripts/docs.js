// generate system prompt

import { readFileSync, readdirSync } from 'fs'

// index directory contents
function indexDirectory(dir) {
  return new Map(readdirSync(dir).map(
    file => [ file.split('.')[0], readFileSync(`${dir}/${file}`, 'utf8').trim() ]
  ))
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

// make doc pages
function getDocs() {
  // load metadata
  const meta = JSON.parse(readFileSync('docs/meta.json', 'utf8'))
  const tags = Object.values(meta).flat()

  // load text and code
  const text = indexDirectory('docs/text')
  const code = indexDirectory('docs/code')

  // make cats and pages
  const cats = new Map(Object.entries(meta))
  const pages = new Map(tags.map(tag =>
    [ tag, `${prepareText(text.get(tag))}\n\n${prepareCode(code.get(tag))}` ]
  ))

  // return cats and pages
  return { cats, pages }
}

export { getDocs }
