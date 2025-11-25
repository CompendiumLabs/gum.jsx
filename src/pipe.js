// pipe server

import readline from 'readline'

import { evaluateGum } from './eval.js'
import { canvas } from './canvas.js'

const handlers = {
    evaluate: async (code, { size }) => {
        const elem = evaluateGum(code, { size: size, dims: true })
        const svg = elem.svg()
        return svg
    },
    render: async (code, { size: size0 }) => {
        const elem = evaluateGum(code, { size: size0, dims: true })
        const svg = elem.svg()
        const { size } = elem
        const png = await canvas.renderPng(svg, { size })
        return png.toString('base64')
    },
}

// create readline interface
const rl = readline.createInterface({ input: process.stdin })

// handle lines from stdin
rl.on('line', async (line) => {
    const { task, code, size: size0 } = JSON.parse(line)
    const size = size0 ?? 1000
    try {
        const result = await handlers[task](code, { size })
        console.log(JSON.stringify({ ok: true, result }))
    } catch (e) {
        console.log(JSON.stringify({ ok: false, result: e.message }))
    }
})
