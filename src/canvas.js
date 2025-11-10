//
// dependencies
//

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

    async renderPng(svg, { size = CANVAS_SIZE } = {}) {
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
        this.lib = await import('canvas')
        registerFont('./src/fonts/IBMPlexSans-Thin.ttf', { family: 'IBM Plex Sans' })
        registerFont('./src/fonts/IBMPlexMono-Regular.ttf', { family: 'IBM Plex Mono' })
        registerFont('./src/fonts/IBMPlexSans-Regular.ttf', { family: 'IBM Plex Sans', weight: 'bold' })
        await super.init()
    }

    makeCanvas(size = CANVAS_SIZE) {
        const [ width, height ] = size
        const canvas = this.lib.createCanvas(width, height)
        const ctx = canvas.getContext('2d')
        return { canvas, ctx }
    }

    async renderPng(svg, { size = CANVAS_SIZE } = {}) {
        const { canvas, ctx } = this.makeCanvas(size)
        const data = Buffer.from(svg).toString('base64')
        const url = `data:image/svg+xml;base64,${data}`
        const img = await this.lib.loadImage(url)
        ctx.drawImage(img, 0, 0)
        return canvas.toBuffer('image/png')
    }
}

class BrowserCanvas extends BaseCanvas {
    makeCanvas(size = CANVAS_SIZE, { dpr: dpr0 = null } = {}) {
        const dpr = dpr0 ?? window.devicePixelRatio ?? 1
        const canvas = document.createElement('canvas')
        const [ width, height ] = size
        canvas.width = Math.round(width * dpr)
        canvas.height = Math.round(height * dpr)
        canvas.style.width = `${Math.round(width)}px`
        canvas.style.height = `${Math.round(height)}px`
        const ctx = canvas.getContext('2d')
        ctx.scale(dpr, dpr)
        return { canvas, ctx }
    }

    async renderPng(svg, { size = CANVAS_SIZE } = {}) {
        return new Promise((resolve, reject) => {
            // make canvas and context
            const { canvas, ctx } = this.makeCanvas(size)
            const { canvas: exportCanvas, ctx: exportCtx } = this.makeCanvas(size, { dpr: 1 })

            // create blob and url
            const blob = new Blob([ svg ], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)

            // set up image and draw svg
            const img = new Image()
            img.onload = () => {
                const [ width, height ] = size
                ctx.drawImage(img, 0, 0, width, height)
                exportCtx.drawImage(canvas, 0, 0, width, height)
                exportCanvas.toBlob((blob) => {
                    if (blob) {
                        URL.revokeObjectURL(url)
                        resolve(blob)
                    } else {
                        const error = new Error('Failed to convert canvas to blob')
                        reject(error)
                    }
                })
            }
            img.src = url
        })
    }
}

//  get a canvas (browser or node)
const canvas = (typeof window == 'undefined') ? new NodeCanvas() : new BrowserCanvas()
await canvas.init()

export { canvas }
