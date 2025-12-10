// pipe server

import readline from 'readline'
import { stdout } from 'process'

import { ErrorNoCode, ErrorParse, ErrorNoReturn, ErrorNoElement, ErrorGenerate, ErrorRender } from './types.js'
import { evaluateGum } from './eval.js'
import { renderPng } from './render.js'

const handlers = {
    evaluate: async (code, { size, theme }) => {
        let elem, svg
        try {
            elem = evaluateGum(code, { size: size, theme })
        } catch (e) {
            throw new ErrorParse(e.message)
        }
        try {
            svg = elem.svg()
        } catch (e) {
            throw new ErrorGenerate(e.message)
        }
        return svg
    },
    render: async (code, { size: size0, theme }) => {
        let elem, svg, png
        try {
            elem = evaluateGum(code, { size: size0, theme })
        } catch (e) {
            throw new ErrorParse(e.message)
        }
        try {
            svg = elem.svg()
        } catch (e) {
            throw new ErrorGenerate(e.message)
        }
        try {
            const { size } = elem
            const png0 = await renderPng(svg, { size })
            png = png0.toString('base64')
        } catch (e) {
            throw new ErrorRender(e.message)
        }
        return png
    },
}

function parseError(e) {
    const { message } = e
    if (e instanceof ErrorNoCode) {
        return { error: 'NOCODE', message }
    } else if (e instanceof ErrorParse) {
        return { error: 'PARSE', message }
    } else if (e instanceof ErrorNoReturn) {
        return { error: 'NORETURN', message }
    } else if (e instanceof ErrorNoElement) {
        return { error: 'NOELEMENT', message }
    } else if (e instanceof ErrorGenerate) {
        return { error: 'GENERATE', message }
    } else if (e instanceof ErrorRender) {
        return { error: 'RENDER', message }
    }
    return { error: 'UNKNOWN', message }
}

// create readline interface
const rl = readline.createInterface({ input: process.stdin })

// handle lines from stdin
rl.on('line', async (line) => {
    const { task, code, size: size0, theme: theme0 } = JSON.parse(line)
    const size = size0 ?? 500
    const theme = theme0 ?? 'light'
    let message = null
    try {
        const result = await handlers[task](code, { size, theme })
        message = { ok: true, result }
    } catch (e) {
        const result = parseError(e)
        message = { ok: false, result }
    }
    stdout.write(JSON.stringify(message) + '\n')
})
