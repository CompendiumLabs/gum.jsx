#! /usr/bin/env bun
import { Command } from 'commander'
import { readFileSync, watchFile, unwatchFile } from 'fs'
import { basename, resolve } from 'path'

import { evaluateGum } from '../src/eval'
import { formatImage, rasterizeSvg } from '../src/render'
import type { Size } from '../src/lib/types'

const IMAGE_IDS = [ 1, 2 ] as const
const PLACEMENT_ID = 1
const CELL_RATIO = 0.5
const MARGIN_COLS = 2
const MARGIN_ROWS = 2
const WATCH_INTERVAL = 100
const RENDER_DELAY = 40

let closed = false
let renderTimer: ReturnType<typeof setTimeout> | null = null
let pendingFullRender = true
let activeImageId: number | null = null
let activeBox: CellRect | null = null
let activeSize: Size | null = null
let lastErrorMessage: string | null = null

interface ViewerOptions {
  theme: string
  background?: string
  size: number
}

interface CellRect {
  cols: number
  rows: number
  col: number
  row: number
}

const program = new Command()
program.name('gum-dev')
  .description('Live gum.jsx viewer for kitty-compatible terminals')
  .argument('<file>', 'gum.jsx file to watch')
  .option('-t, --theme <theme>', 'theme to use', 'light')
  .option('-b, --background <background>', 'background color')
  .option('-s, --size <size>', 'base size of the SVG', (value) => parseInt(value), 1000)
  .parse()

const [ fileArg ] = program.args
const opts = program.opts<ViewerOptions>()
const file = resolve(fileArg)

if (opts.theme == 'light' && opts.background == null) {
  opts.background = 'white'
}

if (!process.stdout.isTTY) {
  console.error('gum-dev requires a TTY')
  process.exit(1)
}

function write(data: string): void {
  process.stdout.write(data)
}

function clearScreen(): void {
  write('\x1b[2J\x1b[H')
}

function clearTextScreen(): void {
  const rows = process.stdout.rows ?? 24
  let out = ''
  for (let row = 1; row <= rows; row++) {
    out += `\x1b[${row};1H\x1b[2K`
  }
  write(out)
}

function moveCursor(row: number, col: number): void {
  write(`\x1b[${row};${col}H`)
}

function textBlockRow(lines: string[]): number {
  const rows = process.stdout.rows ?? 24
  return Math.max(1, Math.floor((rows - lines.length) / 2) + 1)
}

function textBlockCol(lines: string[]): number {
  const cols = process.stdout.columns ?? 80
  const width = Math.max(...lines.map(line => line.length), 0)
  return Math.max(1, Math.floor((cols - width) / 2) + 1)
}

function fitCells(width: number, height: number): CellRect {
  const totalCols = process.stdout.columns ?? 80
  const totalRows = process.stdout.rows ?? 24
  const availCols = Math.max(1, totalCols - MARGIN_COLS)
  const availRows = Math.max(1, totalRows - MARGIN_ROWS)
  const aspect = width / height

  let cols = Math.floor(availRows * aspect / CELL_RATIO)
  let rows = availRows

  if (cols > availCols) {
    cols = availCols
    rows = Math.floor(availCols * CELL_RATIO / aspect)
  }

  cols = Math.max(1, cols)
  rows = Math.max(1, rows)

  return {
    cols,
    rows,
    col: Math.max(1, Math.floor((totalCols - cols) / 2) + 1),
    row: Math.max(1, Math.floor((totalRows - rows) / 2) + 1),
  }
}

function deleteImage(imageId: number): void {
  write(`\x1b_Ga=d,d=I,i=${imageId},q=1\x1b\\`)
}

function placeImage(imageId: number, box: CellRect): void {
  moveCursor(box.row, box.col)
  write(`\x1b_Ga=p,i=${imageId},p=${PLACEMENT_ID},c=${box.cols},r=${box.rows},C=1,q=1\x1b\\`)
}

function nextImageId(): number {
  return activeImageId === IMAGE_IDS[0] ? IMAGE_IDS[1] : IMAGE_IDS[0]
}

function showError(error: unknown): void {
  const message = error instanceof Error ? error.message : String(error)
  lastErrorMessage = message

  if (activeImageId != null) {
    deleteImage(activeImageId)
    activeImageId = null
    activeBox = null
    activeSize = null
  }

  clearTextScreen()

  const lines = [
    basename(file),
    '',
    ...message.split('\n').slice(0, 12),
  ]
  const row = textBlockRow(lines)
  const col = textBlockCol(lines)

  moveCursor(row, col)
  write('\x1b[31m')
  write(lines.join('\n'))
  write('\x1b[0m')
  moveCursor(process.stdout.rows ?? 24, 1)
}

function renderFile(): void {
  try {
    const code = readFileSync(file, 'utf-8')
    const elem = evaluateGum(code, { size: opts.size, theme: opts.theme })
    const svg = elem.svg()
    const [ width, height ] = elem.size
    const box = fitCells(width, height)
    const png = rasterizeSvg(svg, { size: elem.size, background: opts.background })
    const imageId = nextImageId()
    const prevImageId = activeImageId

    if (lastErrorMessage != null) clearTextScreen()

    moveCursor(box.row, box.col)
    write(formatImage(png, {
      imageId,
      placementId: PLACEMENT_ID,
      columns: box.cols,
      rows: box.rows,
      cursorMovement: false,
    }))

    if (prevImageId != null) deleteImage(prevImageId)

    activeImageId = imageId
    activeBox = box
    activeSize = elem.size
    lastErrorMessage = null
    moveCursor(process.stdout.rows ?? 24, 1)
  } catch (error) {
    showError(error)
  }
}

function updateLayout(): void {
  if (lastErrorMessage != null) {
    showError(lastErrorMessage)
    return
  }

  if (activeImageId == null || activeSize == null) {
    renderFile()
    return
  }

  const [ width, height ] = activeSize
  const box = fitCells(width, height)
  if (
    activeBox != null &&
    box.cols === activeBox.cols &&
    box.rows === activeBox.rows &&
    box.col === activeBox.col &&
    box.row === activeBox.row
  ) {
    return
  }

  placeImage(activeImageId, box)
  activeBox = box
  moveCursor(process.stdout.rows ?? 24, 1)
}

function flushRender(): void {
  renderTimer = null

  if (pendingFullRender) {
    pendingFullRender = false
    renderFile()
  } else {
    updateLayout()
  }
}

function scheduleRender(fullRender = false): void {
  if (closed) return
  pendingFullRender = pendingFullRender || fullRender
  if (renderTimer != null) clearTimeout(renderTimer)
  renderTimer = setTimeout(flushRender, RENDER_DELAY)
}

function closeViewer(code = 0): void {
  if (closed) return
  closed = true

  if (renderTimer != null) clearTimeout(renderTimer)
  unwatchFile(file)

  clearScreen()
  write('\x1b[?25h')
  write('\x1b[?1049l')

  process.exit(code)
}

watchFile(file, { interval: WATCH_INTERVAL }, () => scheduleRender(true))
process.on('SIGWINCH', () => scheduleRender(false))
process.on('SIGINT', () => closeViewer(0))
process.on('SIGTERM', () => closeViewer(0))
process.on('uncaughtException', error => {
  showError(error)
})

write('\x1b[?1049h')
write('\x1b[?25l')
scheduleRender(true)
