// mathjax renderer

//
// core config
//

const base_load = [ 'input/tex', 'output/svg' ]

const base_config = {
    options: {
        enableSpeech: false,
        enableBraille: false,
    },
    svg: {
        useXlink: false,
    },
    tex: {
        packages: [ 'base', 'ams' ],
    },
}

//
// parse functions
//

function parse_style(style: string): Map<string, string> {
    return new Map(style
        .split(';')
        .filter(s => s.includes(':'))
        .map(s => s.split(':'))
        .map(([k, v]) => [k.trim(), v.trim()])
    )
}

function parse_ex(s: string | undefined): number {
    if (s == null) return 0
    return parseFloat(s) / 2
}

//
// MathJax interface
//

declare const MathJax: any

type RenderResult = {
    svg: string
    viewBox: string
    width: number
    height: number
    valign: number
}

class MathJaxBase {
    process(tex: string, { display = false } = {}): any {
        const mml = MathJax.tex2mml(tex)
        const out = MathJax.mathml2svg(mml, { display })
        return out.children[0]
    }
}

class MathJaxWeb extends MathJaxBase {
    async init(): Promise<void> {
        (window as any).MathJax = {
            loader: {
                load: base_load,
            },
            ...base_config,
        }
        const mathjax_url = new URL('mathjax/tex-mml-svg.js', import.meta.url)
        await import( /* @vite-ignore */ mathjax_url as any)
    }

    render(tex: string, { display = false } = {}): RenderResult {
        // get svg element
        const elem = super.process(tex, { display })

        // get size and position attributes
        const viewBox = elem.getAttribute('viewBox')
        const style = parse_style(elem.getAttribute('style'))
        const width = parse_ex(elem.getAttribute('width'))
        const height = parse_ex(elem.getAttribute('height'))
        const valign = -parse_ex(style.get('vertical-align'))

        // return full info
        return { svg: elem.innerHTML, viewBox, width, height, valign }
    }
}

class MathJaxNode extends MathJaxBase {
    async init(): Promise<void> {
        // @ts-ignore
        const { source } = await import( /* @vite-ignore */ '@mathjax/src/components/mjs/source.js')
        ;(global as any).MathJax = {
            loader: {
                load: [ 'adaptors/liteDOM', ...base_load ],
                require: ((file: string) => import( /* @vite-ignore */ file)),
                source,
            },
            ...base_config,
        }
        await import( /* @vite-ignore */ source['tex-mml-svg'])
        await MathJax.startup.promise
    }

    render(tex: string, { display = false } = {}): RenderResult {
        const elem = super.process(tex, { display })

        // get size and position attributes
        const { viewBox, style: style0, width: width0, height: height0 } = elem.attributes
        const style = parse_style(style0)
        const width = parse_ex(width0)
        const height = parse_ex(height0)
        const valign = -parse_ex(style.get('vertical-align'))

        // serialize inner html
        const svg = elem.children.map(
            (child: any) => MathJax.startup.adaptor.serializeXML(child)
        ).join('\n')

        // get svg attributes and innerHTML
        return { svg, viewBox, width, height, valign }
    }
}

// initialize mathjax
let mathjax: MathJaxWeb | MathJaxNode | null = null
try {
    mathjax = (typeof window == 'undefined') ? new MathJaxNode() : new MathJaxWeb()
    await mathjax.init()
} catch (error) {
    // console.error(`Failed to initialize MathJax: ${error}`)
}

export { mathjax }
