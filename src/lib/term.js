// terminal display

import { watch, readFileSync } from 'fs'

// kitty graphics protocol constants
const CURSOR_HOME = '\x1b[H'
const DELETE_IMAGE = '\x1b_Ga=d,d=i,i=1,q=1\x1b\\'
const ALT_SCREEN_ON = '\x1b[?1049h'
const ALT_SCREEN_OFF = '\x1b[?1049l'

// read from stdin
async function readStdin() {
  const chunks = []
  for await (const chunk of process.stdin) {
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString('utf-8')
}

// kitty image protocol
function formatImage(pngBuffer, { imageId = null, chunkSize = 4096 } = {}) {
  const idParam = imageId != null ? `,i=${imageId}` : ''
  const base64 = pngBuffer.toString('base64')

  let result = ''
  for (let i = 0; i < base64.length; i += chunkSize) {
    const chunk = base64.slice(i, i + chunkSize)
    const isFirst = i === 0
    const isLast = i + chunkSize >= base64.length
    const control = isFirst
      ? `f=100,a=T${idParam},q=1,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`

    result += `\x1b_G${control};${chunk}\x1b\\`
  }

  return result
}

function watchAndRender(file, displayer) {
  function doRender(prefix, imageId) {
    const content = readFileSync(file, 'utf-8')
    const output = displayer(content, imageId)
    process.stdout.write(prefix + output)
  }

  // enable alternative screen and render
  process.stdout.write(ALT_SCREEN_ON)
  doRender(CURSOR_HOME, 1)

  // watch for file changes
  const watcher = watch(file, (event) => {
    if (event === 'change') {
      try {
        doRender(CURSOR_HOME + DELETE_IMAGE, 1)
      } catch (err) {
        console.error('Render error:', err)
      }
    }
  })

  // handle SIGINT
  process.on('SIGINT', () => {
    watcher.close()
    process.stdout.write(ALT_SCREEN_OFF)
    doRender(DELETE_IMAGE, undefined)
    process.exit(0)
  })
}

export { readStdin, formatImage, watchAndRender }
