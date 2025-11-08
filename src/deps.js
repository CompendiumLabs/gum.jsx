//
// dependencies
//

const CANVAS_SIZE = [ 500, 500 ]

//
// canvas
//

//  get a canvas (browser or node)
let makeCanvas = null, renderSvg = null
if (typeof window == 'undefined') {
    const { createCanvas, registerFont, loadImage } = await import('canvas')
    registerFont('./src/fonts/IBMPlexSans-Thin.ttf', { family: 'IBM Plex Sans' })
    registerFont('./src/fonts/IBMPlexMono-Regular.ttf', { family: 'IBM Plex Mono' })
    registerFont('./src/fonts/IBMPlexSans-Regular.ttf', { family: 'IBM Plex Sans', weight: 'bold' })
    makeCanvas = function(size = CANVAS_SIZE) {
        const [ width, height ] = size
        return createCanvas(width, height)
    }
    renderSvg = async function(svg, { size = 500, fonts = null }) {
        const canvas = makeCanvas(size)
        const ctx = canvas.getContext('2d')
        const data = Buffer.from(svg).toString('base64')
        const url = `data:image/svg+xml;base64,${data}`
        const img = await loadImage(url)
        ctx.drawImage(img, 0, 0)
        return canvas.toBuffer('image/png')
    }
} else {
    makeCanvas = function(size) {
        return document.createElement('canvas')
    }
    renderSvg = async function(svg, { size = 500, fonts = null }) {
        const canvas = makeCanvas(size)
        const ctx = canvas.getContext('2d')
        const img = new Image()
        img.src = svg
        ctx.drawImage(img, 0, 0)
        return canvas.toBuffer('image/png')
    }
}

//
// mathjax renderer
//

try {
    window.MathJax = {
        loader: {
            load: [ 'input/tex', 'output/svg' ],
        },
        options: {
            enableSpeech: false,
            enableBraille: false,
        },
        svg: {
            useXlink: false,
        },
        tex: {
            packages: [ 'base', 'ams' ],
        }
    }
    const mathjax_url = new URL('mathjax/tex-mml-svg.js', import.meta.url)
    await import( /* @vite-ignore */ mathjax_url)
} catch (error) {
    // console.log(error)
}

//
// resvg
//

// for server side rendering
let resvg = null
if (typeof window == 'undefined') {
    resvg = await import('@resvg/resvg-js')
} else {
    // resvg = window.resvg
    // await resvg.initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'))
}

//
// exports
//

export { makeCanvas, renderSvg, resvg }
