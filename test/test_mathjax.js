import { source } from '@mathjax/src/components/js/source.js';

// configure MathJax
global.MathJax = {
  loader: {
    paths: {
        mathjax: '@mathjax/src/bundle'
    },
    load: [ 'adaptors/liteDOM', 'input/tex', 'output/svg' ],
    require: (file => import(file)),
    source: source
  },
  options: {
    enableSpeech: false,
    enableBraille: false,
  },
}

// load tex-mml-svg
await import(source['tex-mml-svg'])
await MathJax.startup.promise

// your code that uses MathJax here
const mml = MathJax.tex2mml('x^2')
const dom = MathJax.mathml2svg(mml)
const tre = dom.children[0]
const svg = MathJax.startup.adaptor.serializeXML(tre)
console.log(svg)

// shut it down
MathJax.done()
