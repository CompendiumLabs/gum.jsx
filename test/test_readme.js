// test readme code examples

import { Svg, Box, Text, Circle, Plot, SymLine, pi, sin, blue } from '../src/gum.js'
import { evaluateGum } from '../src/eval.js'

const size = 500

// test JSX evaluation
console.log('========== JSX evaluation ==========')
const jsx = `
<Plot xlim={[0, 2*pi]} ylim={[-1, 1]} grid margin={0.2} aspect={2}>
  <SymLine fy={sin} stroke={blue} stroke_width={2} />
</Plot>
`.trim()
console.log('JSX:')
console.log(jsx)
const elem = evaluateGum(jsx, { size })
const svg1 = elem.svg()
console.log('SVG:')
console.log(svg1)

// test JavaScript evaluation
console.log('======= JavaScript evaluation ======')
const line = new SymLine({ fy: sin, stroke: blue, stroke_width: 2 })
const plot = new Plot({ children: line, xlim: [0, 2*pi], ylim: [-1, 1], grid: true, margin: 0.2, aspect: 2 })
const svg = new Svg({ children: plot, size })
console.log('SVG:')
const svg2 = svg.svg()
console.log(svg2)

// are they equal?
const equal = svg1 === svg2
console.log(`SVGs are equal: ${equal}`)
