// gum mcp server

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'

import { evaluateGum } from '../../src/eval.js'

function createTool() {
    return {
        description: 'Evaluate gum JSX code to produce an SVG image.',
        inputSchema: {
            code: z.string().describe('gum JSX code to evaluate')
        },
        callback: ({ code }) => {
            // evaluate gum code to svg
            const elem = evaluateGum(code, { size: 1000, theme: 'dark' })
            const svg = elem.svg()

            // return svg as text
            return {
                content: [
                    { type: 'text', text: svg }
                ]
            }
        }
    }
}

async function main() {
    // create server
    const server = new McpServer({ name: 'gum-mcp-server', version: '1.0.0' })
    const { description, inputSchema, callback } = createTool()
    server.registerTool('evaluate', { description, inputSchema }, callback)

    // connect server
    const transport = new StdioServerTransport()
    await server.connect(transport)
}

main().catch(error => {
    console.error('Server error:', error)
    process.exit(1)
})
