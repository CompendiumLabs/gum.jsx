// generate system prompt

import { readFileSync, readdirSync } from 'fs'

// index directory contents
function indexDirectory(dir) {
    return Object.fromEntries(readdirSync(dir).map(
        file => [ file.split('.')[0], readFileSync(`${dir}/${file}`, 'utf8').trim() ]
    ))
}

// make doc pages
function getDocs(docs_dir) {
    // load metadata
    const cats = JSON.parse(readFileSync(`${docs_dir}/meta.json`, 'utf8'))
    const tags = Object.values(cats).flat()

    // load text/code/gallery
    const text = indexDirectory(`${docs_dir}/text`)
    const code = indexDirectory(`${docs_dir}/code`)
    const gala = indexDirectory(`${docs_dir}/gala`)

    // return all docs info
    return { tags, cats, text, code, gala }
}

export { getDocs }
