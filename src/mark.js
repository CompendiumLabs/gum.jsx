// markdown renderer

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'

function parseMarkdown(markdown) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkMath)
    const tree = processor.parse(markdown)
    return tree.children
}

export { parseMarkdown }
