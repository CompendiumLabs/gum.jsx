// kitty image protocol

const CHUNK_SIZE = 4096

function encodeImage(pngBuffer) {
  return pngBuffer.toString('base64')
}

function formatImage(pngBuffer, imageId) {
  const idParam = imageId != null ? `,i=${imageId}` : ''
  const base64 = encodeImage(pngBuffer)

  let result = ''
  for (let i = 0; i < base64.length; i += CHUNK_SIZE) {
    const chunk = base64.slice(i, i + CHUNK_SIZE)
    const isFirst = i === 0
    const isLast = i + CHUNK_SIZE >= base64.length
    const control = isFirst
      ? `f=100,a=T${idParam},q=1,m=${isLast ? 0 : 1}`
      : `m=${isLast ? 0 : 1}`

    result += `\x1b_G${control};${chunk}\x1b\\`
  }

  return result + '\n'
}

export { formatImage }
