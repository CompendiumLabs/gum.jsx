#! /usr/bin/env node

import express from 'express'
import { program } from 'commander'
import { evaluateGum } from './eval.js'
import { ErrorNoCode, ErrorNoReturn, ErrorNoElement } from './eval.js'

function parseError(error) {
  if (error instanceof ErrorNoCode) {
    return 'ERR_NOCODE: No code provided'
  } else if (error instanceof ErrorNoReturn) {
    return 'ERR_NORETURN: No return value'
  } else if (error instanceof ErrorNoElement) {
    return `ERR_NOELEMENT: Return value ${JSON.stringify(error.value)}`
  } else {
    return `ERR_EVALUATE: ${error.message}`
  }
}

// get host and port args from cli
program
  .option('-h, --host <host>', 'host to listen on', 'localhost')
  .option('-p, --port <port>', 'port to listen on', v => parseInt(v, 10), 3000)
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
app.post('/', (req, res) => {
  // get params
  const code = req.body
  const size0 = parseInt(req.query.size ?? 500)
  const theme = req.query.theme ?? 'light'

  // evaluate code and return svg
  let svg
  try {
    const elem = evaluateGum(code, { size: size0, theme })
    svg = elem.svg()
  } catch (error) {
    const message = parseError(error)
    return res.status(500).send(message)
  }

  // send svg
  res.setHeader('Content-Type', 'image/svg+xml')
  res.send(svg)
})

// start server
app.listen(port, host, () => {
  // console.log(`Server running on http://${host}:${port}`)
})
