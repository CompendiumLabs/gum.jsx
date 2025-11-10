//
// dependencies
//

const CANVAS_SIZE = [ 500, 500 ]

class BaseCanvas {
    async init() {
        this.canvas = this.makeCanvas()
        this.ctx = this.canvas.getContext('2d')
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
        return this.lib.createCanvas(width, height)
    }

    async renderPng(svg, { size = CANVAS_SIZE } = {}) {
        const canvas = this.makeCanvas(size)
        const ctx = canvas.getContext('2d')
        const data = Buffer.from(svg).toString('base64')
        const url = `data:image/svg+xml;base64,${data}`
        const img = await this.lib.loadImage(url)
        ctx.drawImage(img, 0, 0)
        return canvas.toBuffer('image/png')
    }
}

class BrowserCanvas extends BaseCanvas {
    makeCanvas(size = CANVAS_SIZE) {
        const canvas = document.createElement('canvas')
        const [ width, height ] = size
        canvas.width = width
        canvas.height = height
        return canvas
    }

    async renderPng(svg, { size = CANVAS_SIZE } = {}) {
        return new Promise((resolve, reject) => {
            // make canvas and context
            const canvas = this.makeCanvas(size)
            const ctx = canvas.getContext('2d')
            const [ width, height ] = size

            // create blob and url
            const blob = new Blob([ svg ], { type: 'image/svg+xml' })
            const url = URL.createObjectURL(blob)

            // set up image and draw svg
            const img = new Image()
            img.onload = () => {
                ctx.drawImage(img, 0, 0, width, height)
                canvas.toBlob((blob) => {
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
