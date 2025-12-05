// canvas for text and image rendering

//
// constants
//

const CANVAS_SIZE = [ 500, 500 ]

//
// browser canvas
//

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

class BrowserCanvas {
    async init() {
        const { canvas, ctx } = this.makeCanvas()
        this.canvas = canvas
        this.ctx = ctx
    }

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

// create canvas instance
const canvas = (typeof window == 'undefined') ? null : new BrowserCanvas()
if (canvas != null) await canvas.init()

//
// export canvas
//

export { canvas }
