// test cli

import { program } from 'commander'

import { waitForStdin } from './node.js'
import { CONSTANTS as C, setTheme } from './defaults.js'
import { textSizer, splitWords, is_emoji, FONTS } from './text.js'
import { evaluateGum } from './eval.js'

// evaluate command
async function cmdEvaluate({ debug }) {
  const code = await waitForStdin()
  setTheme('dark')
  const elem = evaluateGum(code, { debug, size: 1000 })
  const svg = elem.svg()
  console.log(svg)
}

// sizing command
async function cmdSizing(text, { chunks, family, weight, size }) {
  const words = chunks ? splitWords(text) : [ text ]
  for (const word of words) {
    const width = textSizer(word, { font_family: family, font_weight: weight, calc_size: size })
    console.log(`"${word}" → ${width.toFixed(4)}em`)
  }
}

// get options from commander
program.command('evaluate', )
  .option('-d, --debug', 'debug mode', false)
  .action(cmdEvaluate)

program.command('sizing')
  .argument('<text>', 'text to size')
  .option('-f, --family <family>', 'font family', 'IBM Plex Sans')
  .option('-w, --weight <weight>', 'font weight', 'normal')
  .option('-s, --size <size>', 'font size', 16)
  .option('-c, --chunks', 'split chunks', false)
  .action(cmdSizing)

program.parse()
