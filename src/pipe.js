// pipe server

import readline from 'readline'
import { stdout } from 'process'

import { evaluateGum } from './eval.js'
import { canvas } from './canvas.js'

const handlers = {
    evaluate: async (code, { size, theme }) => {
        const elem = evaluateGum(code, { size: size, theme })
        const svg = elem.svg()
        return svg
    },
    render: async (code, { size: size0, theme }) => {
        const elem = evaluateGum(code, { size: size0, theme })
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
    const { task, code, size: size0, theme: theme0 } = JSON.parse(line)
    const size = size0 ?? 1000
    const theme = theme0 ?? 'light'
    let message = null
    try {
        const result = await handlers[task](code, { size, theme })
        message = { ok: true, result }
    } catch (e) {
        message = { ok: false, result: e.message }
    }
    stdout.write(JSON.stringify(message) + '\n')
})
