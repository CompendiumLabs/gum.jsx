//
// dependencies
//

import path from 'path'

const CANVAS_SIZE = [ 500, 500 ]

class BaseCanvas {
    async init() {
        const { canvas, ctx } = this.makeCanvas()
        this.canvas = canvas
        this.ctx = ctx
    }

    makeCanvas(size = CANVAS_SIZE) {
        throw new Error('makeCanvas not implemented')
    }

    async renderPng(svg, { size = CANVAS_SIZE, background = null } = {}) {
        throw new Error('renderSvg not implemented')
    }

    textSizer(text, font) {
        this.ctx.font = font
        const { width } = this.ctx.measureText(text)
        return width
    }
}

class NodeCanvas extends BaseCanvas {
    async init() {
        // Get __dirname in ES modules
        const { fileURLToPath } = await import('url')
        const __filename = fileURLToPath(import.meta.url)
        const __dirname = path.dirname(__filename)
        const font_dir = path.join(__dirname, 'fonts')

        // register fonts
        this.lib = await import('canvas')
        this.lib.registerFont(path.join(font_dir, 'IBMPlexSans-Variable.ttf'), { family: 'IBM Plex Sans' })
        this.lib.registerFont(path.join(font_dir, 'IBMPlexMono-Regular.ttf'), { family: 'IBM Plex Mono' })
        await super.init()
    }

    makeCanvas(size = CANVAS_SIZE) {
        const [ width, height ] = size
        const canvas = this.lib.createCanvas(width, height)
        const ctx = canvas.getContext('2d')
        return { canvas, ctx }
    }

    async renderPng(svg, { size = CANVAS_SIZE, background = null } = {}) {
        const [ width, height ] = size

        // make canvas and context
        const { canvas, ctx } = this.makeCanvas(size)

        // load svg image
        const img = await new Promise((resolve, reject) => {
            const img = new this.lib.Image()
            img.onload = () => resolve(img)
            img.onerror = err => { throw err }
            img.src = Buffer.from(svg)
        })

        // fill background
        if (background != null) {
            ctx.fillStyle = background
            ctx.fillRect(0, 0, width, height)
        }

        // draw svg and return buffer
        ctx.drawImage(img, 0, 0)
        const data = canvas.toBuffer('image/png')

        // return png data
        return data
    }
}

function loadImage(url) {
    return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = () => reject(new Error('Failed to load image'))
        img.src = url
    })
}

function canvasToBlob(canvas) {
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                resolve(blob)
            } else {
                reject(new Error('Failed to convert canvas to blob'))
            }
        })
    })
}

class BrowserCanvas extends BaseCanvas {
    makeCanvas(size = CANVAS_SIZE, { dpr: dpr0 = null } = {}) {
        const dpr = dpr0 ?? window.devicePixelRatio ?? 1
        const [ width, height ] = size

        // make canvas and ensize
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = `${Math.round(width)}px`
        canvas.style.height = `${Math.round(height)}px`

        // make context and scale
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)

        // return canvas and context
        return { canvas, ctx }
    }

    async renderPng(svg, { size = CANVAS_SIZE, background = 'white' } = {}) {
        const [ width, height ] = size

        // make canvas and context
        const { canvas, ctx } = this.makeCanvas(size)
        const { canvas: exportCanvas, ctx: exportCtx } = this.makeCanvas(size, { dpr: 1 })

        // load svg image
        const svgBlob = new Blob([ svg ], { type: 'image/svg+xml' })
        const svgUrl = URL.createObjectURL(svgBlob)
        const svgImg = await loadImage(svgUrl)

        // fill background
        if (background != null) {
            ctx.fillStyle = background
            ctx.fillRect(0, 0, width, height)
        }

        // draw svg and export canvas
        ctx.drawImage(svgImg, 0, 0, width, height)
        exportCtx.drawImage(canvas, 0, 0, width, height)

        // convert export canvas to blob
        const pngBlob = await canvasToBlob(exportCanvas)
        URL.revokeObjectURL(svgUrl)

        // return png blob
        return pngBlob
    }
}

//  get a canvas (browser or node)
const canvas = (typeof window == 'undefined') ? new NodeCanvas() : new BrowserCanvas()
await canvas.init()

export { canvas }
