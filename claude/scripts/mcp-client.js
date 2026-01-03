// gum mcp client

import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

const code = `
<Box padding margin border rounded>
  <Text>Hello, world!</Text>
</Box>
`.trim()

async function main() {
    // create client
    const client = new Client({ name: 'gum-mcp-client', version: '1.0.0' }, { capabilities: {} });
    const transport = new StdioClientTransport({ command: 'node', args: ['scripts/mcp-server.js'] })

    // connect client
    await client.connect(transport)
    console.log('Connected successfully.')

    // list tools
    const tools = await client.listTools()
    console.log('TOOLS:', tools.tools.map(t => t.name).join(', ') || '(none)')

    // evaluate gum code
    console.log('GUM:')
    console.log(code)
    const { content } = await client.callTool({ name: 'evaluate', arguments: { code } })
    const { text: svg } = content[0]
    console.log('SVG:')
    console.log(svg)

    // close transport
    await transport.close()
}

main().catch(err => {
    console.error(err)
    process.exit(1)
})
