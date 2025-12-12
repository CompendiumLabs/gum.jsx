import { evaluateGum } from '../src/eval.js'
import { renderPng } from '../src/render.js'

const code = `
<Box padding margin border rounded>
  <Text>Hello, world!</Text>
</Box>
`.trim()

// evaluate gum code to svg
const elem = evaluateGum(code, { size: 500, theme: 'dark' })
const svg = elem.svg()
const png = renderPng(svg, { size: 1000, background: 'black' })

// print png to console
process.stdout.write(png)
