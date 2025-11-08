// test babel react-jsx

import { transform, registerPlugin } from '@babel/standalone'

// preserve newlines inside JSX
registerPlugin("preserve-jsx-whitespace", function ({ types: t }) {
    return {
        name: "preserve-jsx-whitespace",
        visitor: {
            JSXText(path) {
                const raw = path.node.value
                    .replace(/ +/g, ' ')
                    .replace(/\n+/g, '\n')
                    .trim()
                path.replaceWith(t.JSXExpressionContainer(t.stringLiteral(raw)))
            },
        },
    }
})

function h(tag, props, ...children) {
    return { tag, props, children }
}

function parseJSX(input) {
    const { code } = transform(input, {
        plugins: [
            'preserve-jsx-whitespace',
            [ 'transform-react-jsx', { pragma: 'h' } ]
        ]
    })
    return code
}

const input = `
<Slide markdown>
    - Hello world!
    - This is a test.
</Slide>
`.trim()

const output = parseJSX(input)
console.log(output)
