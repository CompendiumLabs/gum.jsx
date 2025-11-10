// mathjax renderer

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
