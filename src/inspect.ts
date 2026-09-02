// inspecting a rendered figure: zooming into a region and listing the layout
//
// Both take an evaluated `Svg` (from `evaluateGum`) and are what the studio's
// snapshot/exec tools and the `gum` CLI's `--zoom` and `--format layout` use,
// so an agent sees the same thing in either place.

import { Context, Svg, Element } from './elems/core'
import type { Rect } from './lib/types'

//
// zoom: crop an svg to a fractional region of its viewBox
//

// a region as [x0, y0, x1, y1] fractions of the figure, origin at the top left
type Zoom = [ number, number, number, number ]

// check a zoom region, returning an error message or null
function validateZoom(zoom: any): string | null {
  if (!Array.isArray(zoom) || zoom.length != 4 || !zoom.every(z => typeof z == 'number' && Number.isFinite(z))) {
    return 'zoom must be an array of four numbers [x0, y0, x1, y1]'
  }
  const [ x0, y0, x1, y1 ] = zoom
  if (x0 < 0 || y0 < 0 || x1 > 1 || y1 > 1) return 'zoom coordinates must be fractions between 0 and 1'
  if (x0 >= x1 || y0 >= y1) return 'zoom region must have x0 < x1 and y0 < y1'
  return null
}

// the zoom region in the svg's view coordinates
function zoomRect(elem: Svg, zoom: Zoom): Rect {
  const [ vx0, vy0, vx1, vy1 ] = elem.viewrect
  const vw = vx1 - vx0
  const vh = vy1 - vy0
  const [ fx0, fy0, fx1, fy1 ] = zoom
  return [ vx0 + fx0 * vw, vy0 + fy0 * vh, vx0 + fx1 * vw, vy0 + fy1 * vh ]
}

// rebuild the svg with its viewBox cropped to the zoom region, magnified to
// fill the original size box (the children keep their layout, since the size
// they are laid out into is unchanged; only the view and the output dims move)
function zoomSvg(elem: Svg, zoom: Zoom): Svg {
  const { size: [ width, height ], args } = elem
  const [ fx0, fy0, fx1, fy1 ] = zoom
  const fw = fx1 - fx0
  const fh = fy1 - fy0

  // the cropped region in the original view coordinates
  const view = zoomRect(elem, zoom)

  // magnify the crop to fit the original size box, keeping its aspect
  const scale = Math.min(1 / fw, 1 / fh)
  const outWidth = Math.round(fw * width * scale)
  const outHeight = Math.round(fh * height * scale)

  // same args, so the children lay out exactly as before; the view is already
  // padded, and the output dims go on as plain attributes in place of the size
  return new Svg({ ...args, view, padding: 0, dims: false, width: outWidth, height: outHeight })
}

//
// layout: walk the element tree and report where everything landed
//

type LayoutOptions = {
  depth?: number   // how many levels below the root to descend (default 4)
  select?: string  // only report elements whose path, type, id, or class contains this
  zoom?: Zoom      // only report elements intersecting this region
}

type LayoutRow = {
  path: string
  type: string
  id?: string
  class?: string
  text?: string
  rect: Rect     // where the element was placed
  alloc?: Rect   // the box its parent allocated to it
  rotate?: number
}

const LAYOUT_DEPTH = 4
const LAYOUT_SKIP = new Set([ 'ClipPath', 'Mask', 'Style', 'Metadata' ])
const MAX_LAYOUT_ROWS = 200

// normalize to [xmin, ymin, xmax, ymax] (flipped coordinate frames can swap corners) and round
function roundRect([ x0, y0, x1, y1 ]: Rect): Rect {
  const rect = [ Math.min(x0, x1), Math.min(y0, y1), Math.max(x0, x1), Math.max(y0, y1) ]
  return rect.map(v => Math.round(v * 10) / 10) as Rect
}

function rectsIntersect([ ax0, ay0, ax1, ay1 ]: Rect, [ bx0, by0, bx1, by1 ]: Rect): boolean {
  return Math.min(ax0, ax1) < Math.max(bx0, bx1) && Math.max(ax0, ax1) > Math.min(bx0, bx1)
    && Math.min(ay0, ay1) < Math.max(by0, by1) && Math.max(ay0, ay1) > Math.min(by0, by1)
}

// the text an element carries, if any (a span's own text, or a text block's spans)
function elementText(elem: any): string | undefined {
  if (typeof elem.text == 'string') return elem.text
  if (Array.isArray(elem.spans)) return elem.spans.map((s: any) => s.text ?? '').join('')
  return undefined
}

// the rows of the layout listing plus the total number of matching elements
// (the rows are capped at MAX_LAYOUT_ROWS, so total can exceed rows.length)
function layoutRows(elem: Svg, { depth = LAYOUT_DEPTH, select, zoom }: LayoutOptions = {}): { rows: LayoutRow[], total: number } {
  const { size: [ width, height ], prec, unit_size } = elem
  const ctx0 = new Context({ prect: [ 0, 0, width, height ], prec, unit: Math.max(width, height) / unit_size })

  // the zoom region in pixel coordinates
  const region = zoom == null ? null : zoomRect(elem, zoom)
  const needle = select?.toLowerCase()

  const rows: LayoutRow[] = []
  let total = 0

  // mirror Group.inner: each child renders in ctx.map(child.spec), whose prect is its placed box.
  // anonymous Group wrappers (which layouts insert freely) are transparent: no row, path segment, or level.
  // counter numbers the visible children of a visible parent, across transparent wrappers
  function visit(node: Element, ctx: Context, parent: string, alloc: Rect | undefined, level: number, counter: { n: number }) {
    const type = node.constructor.name
    if (LAYOUT_SKIP.has(type)) return
    const { id, class: cls } = node.attr
    const rect = ctx.prect

    // anonymous groups pass straight through to their children
    const transparent = type == 'Group' && id == null && cls == null && level > 0
    let path = parent
    if (!transparent) {
      path = level == 0 ? type : `${parent}/${type}[${counter.n++}]`
      const keep = (region == null || rectsIntersect(rect, region))
        && (needle == null || [ path, type, id, cls ].some(s => typeof s == 'string' && s.toLowerCase().includes(needle)))
      if (keep) {
        total += 1
        if (rows.length < MAX_LAYOUT_ROWS) {
          const row: LayoutRow = { path, type, rect: roundRect(rect) }
          if (id != null) row.id = id
          if (cls != null) row.class = cls
          const text = elementText(node)
          if (text != null) row.text = text
          if (alloc != null) row.alloc = roundRect(alloc)
          const { rotate } = node.spec
          if (rotate) row.rotate = rotate
          rows.push(row)
        }
      }
      if (level >= depth) return
      level += 1
      counter = { n: 0 }
    }

    // recurse into children
    const children: Element[] = (node as any).children ?? []
    for (const child of children) {
      const cctx = ctx.map(child.spec)
      const calloc = ctx.mapRect(child.spec.rect ?? ctx.coord)
      visit(child, cctx, path, calloc, level, counter)
    }
  }

  visit(elem, ctx0, '', undefined, 0, { n: 0 })
  return { rows, total }
}

// the layout listing as text: a few lines of notes, then one json row per element
function layoutSvg(elem: Svg, options: LayoutOptions = {}): string {
  const [ width, height ] = elem.size.map(v => Math.round(v * 10) / 10)
  const { rows, total } = layoutRows(elem, options)
  const { zoom } = options

  const notes = [
    `Layout of a ${width}x${height} figure in pixel coordinates with the origin at the top left.`,
    'rect is the box the element was placed in, alloc is the box its parent allocated to it (rect fits inside alloc after aspect and alignment). Paths index visible children in order; anonymous Group wrappers are omitted.',
    `${total} elements` + (total > rows.length ? ` (showing the first ${rows.length}; use select or depth to narrow)` : '') + (zoom != null ? ' in the zoom region' : '') + '.',
  ]
  return [ ...notes, ...rows.map(row => JSON.stringify(row)) ].join('\n')
}

//
// export
//

export { validateZoom, zoomRect, zoomSvg, layoutRows, layoutSvg, LAYOUT_DEPTH }
export type { Zoom, LayoutOptions, LayoutRow }
