// gum express server

import express from 'express'
import { program } from 'commander'
import { evaluateGum } from './eval.js'
import { canvas } from './canvas.js'
import { ErrorNoCode, ErrorNoReturn, ErrorNoElement, ErrorParse } from './eval.js'

class ErrorGenerate extends Error {
  constructor(error) {
    super(error.message)
    this.name = 'ErrorGenerate'
    this.error = error
  }
}

class ErrorRender extends Error {
  constructor(error) {
    super(error.message)
    this.name = 'ErrorRender'
    this.error = error
  }
}

function parseError(error) {
  if (error instanceof ErrorNoCode) {
    return 'ERR_NOCODE: No code provided'
  } else if (error instanceof ErrorNoReturn) {
    return 'ERR_NORETURN: No return value'
  } else if (error instanceof ErrorNoElement) {
    return `ERR_NOELEMENT: Return value ${JSON.stringify(error.value)}`
  } else if (error instanceof ErrorParse) {
    return `ERR_PARSE: ${error.error.message}`
  } else if (error instanceof ErrorGenerate) {
    return `ERR_GENERATE: ${error.error.message}`
  } else if (error instanceof ErrorRender) {
    return `ERR_RENDER: ${error.error.message}`
  } else {
    return `ERR_UNKNOWN: ${error.message}`
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
  const size0 = parseInt(req.query.size ?? 750)

  // evaluate code and return svg
  let svg
  try {
    const elem = evaluateGum(code, { size: size0, dims: true })
    try {
      svg = elem.svg()
    } catch (err) {
      throw new ErrorGenerate(err)
    }
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
  const size0 = parseInt(req.query.size ?? 750)

  // evaluate code and render to png
  let png, svg
  try {
    const elem = evaluateGum(code, { size: size0, dims: true })
    try {
      svg = elem.svg()
    } catch (err) {
      throw new ErrorGenerate(err)
    }
    try {
      const { size } = elem
      png = await canvas.renderPng(svg, { size })
    } catch (err) {
      throw new ErrorRender(err)
    }
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
