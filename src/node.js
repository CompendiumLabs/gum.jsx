// node utils

// wait for stdin
function waitForStdin() {
  return new Promise((resolve) => {
      process.stdin.setEncoding('utf8')
      process.stdin.once('data', (data) => {
          resolve(data.trim())
      })
  })
}

export { waitForStdin }
