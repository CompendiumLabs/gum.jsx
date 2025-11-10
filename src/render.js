//
// rendering
//

// for server side rendering
let resvg = null
if (typeof window == 'undefined') {
    resvg = await import('@resvg/resvg-js')
} else {
    // resvg = window.resvg
    // await resvg.initWasm(fetch('https://unpkg.com/@resvg/resvg-wasm/index_bg.wasm'))
}

function resvgRender(svg, { size = 500, fonts = null }) {
    const fontsArgs = (typeof window == 'undefined') ? {
        loadSystemFonts: false,
        fontFiles: fonts ?? [
            './fonts/IBMPlexSans-Variable.ttf',
            './fonts/IBMPlexMono-Regular.ttf',
        ],
        defaultFontFamily: 'IBM Plex Sans',
        sansFamily: 'IBM Plex Sans',
        monoFamily: 'IBM Plex Mono',
    } : {
        fontBuffers: fonts
    }

    const resvgjs = new resvg.Resvg(svg, {
        background: 'rgba(255, 255, 255, 1)',
        fitTo: {
            mode: 'width',
            width: size,
        },
        font: fontsArgs,
    })

    const data = resvgjs.render()
    return data.asPng()
}

//
// exports
//

export { resvgRender }
