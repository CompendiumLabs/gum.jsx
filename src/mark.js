// markdown renderer

import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkMath from 'remark-math'

function process_marktree(tree, handlers={}) {
    const { type, children, value } = tree
    if (type == 'paragraph') {
        return children.flatMap(x => process_marktree(x, handlers))
    } else if (type == 'text') {
        return value
    } else if (type in handlers) {
        return handlers[type](tree)
    } else {
        console.error(`Unsupported markdown type: ${type}`)
    }
}

function parse_markdown(markdown) {
    const processor = unified()
        .use(remarkParse)
        .use(remarkMath)
    const tree = processor.parse(markdown)
    return tree.children
}

function process_markdown(markdown, handlers={}) {
    const tree = parse_markdown(markdown)
    return tree.flatMap(x => process_marktree(x, handlers))
}

export { process_markdown }
