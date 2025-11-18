import katex from 'katex'
import { is_array, is_object, map_object } from '../src/utils.js'

// read stdin
async function readStdin() {
    const chunks = []
    for await (const chunk of process.stdin) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
}

function strip_locs(tree) {
    if (is_array(tree)) {
        return tree.map(x => strip_locs(x))
    } else if (is_object(tree)) {
        const { loc, ...rest } = tree
        return map_object(rest, (k, v) => strip_locs(v))
    } else {
        return tree
    }
}

// get tex from stdin and parse
const tex = await readStdin()
const tree = katex.__parse(tex)
const core = strip_locs(tree)
console.log(JSON.stringify(core))
