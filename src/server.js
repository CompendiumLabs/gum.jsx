// gum express server

import express from 'express'
import { program } from 'commander'
import { evaluateGum } from './eval.js'
import { canvas } from './canvas.js'
import { ErrorNoCode, ErrorNoReturn, ErrorReturn } from './eval.js'

function parseError(error) {
  if (error instanceof ErrorNoCode) {
    return 'ERR_NOCODE: No code provided'
  } else if (error instanceof ErrorNoReturn) {
    return 'ERR_NORETURN: No return value'
  } else if (error instanceof ErrorReturn) {
    return `ERR_RETURN: ${JSON.stringify(error.value)}`
  } else {
    return `ERR_EXECUTION: ${error.message}`
  }
}

// get host and port args from cli
program
  .option('-h, --host <host>', 'host to listen on', 'localhost')
  .option('-p, --port <port>', 'port to listen on', parseInt, 3000)
  .parse()
const { host, port } = program.opts()

// create express app
const app = express()
app.use(express.raw({ type: '*/*', limit: '1mb' }));

// convert buffer to string for text-based routes
app.use((req, res, next) => {
  if (req.method === 'POST' && Buffer.isBuffer(req.body)) {
    req.body = req.body.toString('utf8')
  }
  next()
})

// status message
app.get('/', (req, res) => {
  res.send('GUM')
})

// eval gum jsx to svg
app.post('/eval', (req, res) => {
  // get params
  const code = req.body
  const size0 = parseInt(req.query.size ?? 500)

  // evaluate code and return svg
  let svg
  try {
    const elem = evaluateGum(code, { size: size0, dims: true })
    svg = elem.svg()
  } catch (error) {
    const message = parseError(error)
    return res.status(500).send(message)
  }

  // send svg
  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svg)
})

// render gum jsx to png
app.post('/render', async (req, res) => {
  // get params
  const code = req.body
  const size0 = parseInt(req.query.size ?? 500)

  // evaluate code and render to png
  let png
  try {
    const elem = evaluateGum(code, { size: size0, dims: true })
    const svg = elem.svg()
    const { size } = elem
    png = await canvas.renderPng(svg, { size })
  } catch (error) {
    const message = parseError(error)
    return res.status(500).send(message)
  }

  // send png
  res.setHeader('Content-Type', 'image/png')
  res.send(png)
})

// start server
app.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`)
})
