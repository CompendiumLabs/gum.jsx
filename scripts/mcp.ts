#! /usr/bin/env bun

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import * as z from 'zod/v4'

import { evaluateGum } from '../src/eval'
import { rasterizeSvg } from '../src/render'

const mcpServer = new McpServer({
    name: 'gum-jsx',
    version: '1.0.0'
})

mcpServer.registerTool(
    'render',
    {
        description: 'Render gum.jsx code to PNG',
        inputSchema: {
            code: z.string().describe('gum.jsx code to render')
        }
    },
    async ({ code }: { code: string }) => {
        try {
            const elem = evaluateGum(code, { size: [1000, 750] })
            const svg = elem.svg()
            const png = rasterizeSvg(svg, { size: elem.size, background: 'white' })

            return {
                content: [
                    { type: 'image', mimeType: 'image/png', data: png.toString('base64') }
              ]
            }
        } catch (error: any) {
            return {
                content: [
                    { type: 'text', text: error.message }
                ]
            }
        }
    }
)

async function main() {
    const transport = new StdioServerTransport()
    await mcpServer.connect(transport)
}

main().catch((error: any) => {
    console.error('Server error:', error)
    process.exit(1)
})
