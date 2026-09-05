// em layout: elements carrying em metrics (see lib/em.ts) and the layouts that
// compose them. The math elements build on these with their own spacing rules
// and styles; the Text* elements with theirs

import { sum, max, merge_limits, ensure_pair } from '../lib/utils'
import { EMPTY_EM, DEFAULT_EM, make_em, text_em, bounds_em, em_bounds, em_aspect, em_rect, hull_overhang, scale_em_spec } from '../lib/em'
import type { EmSpec, EmMetrics } from '../lib/em'
import type { TextMetrics } from '../lib/text'
import type { Attrs, Rect, Limit, Align } from '../lib/types'

import { Context, Element, Group, align_frac } from './core'

//
// elements with metrics
//

type WithEm<E extends Element = Element> = E & {
    em: EmSpec
}

// the metrics an element without any gets: a Span's from its text box,
// anything else a one-em box as wide as its aspect
function ensure_em_spec(element: Element): EmMetrics {
    const metrics = (element as { metrics?: TextMetrics }).metrics
    if (metrics != null) return text_em(metrics)
    const { width, height, anchor } = DEFAULT_EM
    return { width: element.spec.aspect ?? width, height, anchor }
}

// a clone of the element with its metrics patched (a subtype's extra fields
// pass through make_em untouched)
function with_em<E extends Element>(element: E, patch: Partial<EmSpec> = {}, args: Attrs = {}): WithEm<E> {
    const out = element.clone(args) as WithEm<E>
    const em = (element as WithEm<E>).em ?? make_em(ensure_em_spec(element))
    out.em = make_em({ ...em, ...patch })
    return out
}

function ensure_em<E extends Element>(element: E): WithEm<E> {
    if ((element as WithEm<E>).em != null) return element as WithEm<E>
    return with_em(element)
}

// scale an element's metrics uniformly: content laid out in a smaller em is
// reported in its parent's, and rendering follows the metrics
function scale_em<E extends Element>(element: WithEm<E>, scale: number): WithEm<E> {
    if (scale == 1) return element
    return with_em(element, scale_em_spec(element.em, scale))
}

// a context whose stroke unit is this box's pixels per em, so a stroke_width
// in em is the same rule at any font size
function em_context(ctx: Context): Context {
    return ctx.clone({ unit: Math.abs(ctx.resizex(1, false)) })
}

//
// explicit placement
//

// an item placed with its anchor at (x, y) in a shared anchor frame; `align`
// centers or justifies it within a rect of the given width
type Placed = {
    item: WithEm
    x: number
    y: number
    width?: number
    align?: Align
}

// assemble explicitly placed items into a group whose anchor is at y = 0 and
// whose box is the union of the placed boxes (optionally padded), or the given
// width when some items are not to count (an accent glyph)
function place_items(placed: Placed[], pad: Limit = [ 0, 0 ], width0?: number): WithEm<Group> {
    // an item given a width is justified within it; otherwise it draws in its
    // own ink box, which may overhang its layout box
    const rects = placed.map(({ item, x, y, width }) => {
        const [ x1, y1, x2, y2 ] = em_rect(item.em, x, y)
        return (width != null ? [ x, y1, x + width, y2 ] : [ x1, y1, x2, y2 ]) as Rect
    })
    const children = placed.map(({ item, align }, i) =>
        with_em(item, {}, { rect: rects[i], ...(align != null ? { align } : {}) })
    )

    // the layout box is the union of the layout boxes
    const width = width0 ?? max(placed.map(({ item, x, width }) => x + (width ?? item.em.width))) ?? 0
    const [ ylo0, yhi0 ] = merge_limits(placed.map(({ item, y }) => {
        const [ lo, hi ] = em_bounds(item.em)
        return [ y + lo, y + hi ] as Limit
    }))
    const bounds: Limit = [ ylo0 - pad[0], yhi0 + pad[1] ]

    // the group draws the ink hull, which the layout box may not cover
    const { hink, vink, coord } = hull_overhang(rects, width, bounds)
    const metrics = bounds_em(width, bounds, { hink, vink })
    const group = new Group({ children, coord, aspect: em_aspect(metrics), env: placed[0]?.item.env })
    return with_em(group, metrics)
}

//
// row and column
//

type EmLayout = {
    children: Element[]
    metrics: EmMetrics
    coord?: Rect
    aspect?: number
}

// horizontal concatenation: widths accumulate left to right and every child's
// anchor sits on y = 0
function layout_em_row(items: WithEm[]): EmLayout {
    // empty case
    if (items.length == 0) return { children: [], aspect: 0, metrics: EMPTY_EM }

    // find outer vertical range
    const width = sum(items.map(item => item.em.width))
    const bounds = merge_limits(items.map(item => em_bounds(item.em)))

    // compute placements
    let xmax = 0
    const rects = items.map(item => {
        const { width: x } = item.em
        xmax += x
        return em_rect(item.em, xmax - x, 0)
    })
    const children = items.map((item, i) => with_em(item, {}, { rect: rects[i] }))

    // the ink hull covers the layout box plus any overhang from the items
    const { hink, vink, coord } = hull_overhang(rects, width, bounds)

    // compute layout metrics
    const metrics = bounds_em(width, bounds, { hink, vink })
    const aspect = em_aspect(metrics)

    // return layout
    return { children, coord, aspect, metrics }
}

type EmColOptions = {
    justify?: Align
    spacing?: number
    anchor?: 'center' | 'first'  // the column's anchor: its middle (math) or its first child's (text)
}

// vertical stacking in a top-origin frame, each child keeping its own anchor line
function layout_em_col(items: WithEm[], { justify = 'center', spacing = 0, anchor: anchor0 = 'center' }: EmColOptions = {}): EmLayout {
    // empty case
    if (items.length == 0) return { children: [], aspect: 0, metrics: EMPTY_EM }

    // find outer width
    const width = max(items.map(item => item.em.width)) ?? 0
    const halign = align_frac(ensure_pair(justify)[0])

    // stack top-down while preserving each child's anchor line
    let ybottom = 0
    let yfirst = 0
    const rects = items.map((item, i) => {
        const [ ylo, yhi ] = em_bounds(item.em)
        const yanchor = ybottom + (i > 0 ? spacing : 0) - ylo
        if (i == 0) yfirst = yanchor
        ybottom = yanchor + yhi
        // Align the layout box, then place its full ink at that scale. Fitting
        // the ink into a layout-width slot would shrink an overhanging child.
        const x = halign * (width - item.em.width)
        return em_rect(item.em, x, yanchor)
    })
    const children = items.map((item, i) => with_em(item, {}, { rect: rects[i], align: justify }))

    // Keep layout spacing independent of ink. These bounds and coordinates
    // use the column's top-origin frame, so vink is already relative to its top.
    const { hink, vink, coord } = hull_overhang(rects, width, [ 0, ybottom ])
    const anchor = anchor0 == 'first' ? yfirst : 0.5 * ybottom
    const metrics: EmMetrics = { width, height: ybottom, anchor, hink, vink }
    const aspect = em_aspect(metrics)

    // return layout
    return { children, coord, aspect, metrics }
}

//
// exports
//

export { ensure_em_spec, with_em, ensure_em, scale_em, em_context, place_items, layout_em_row, layout_em_col }
export type { WithEm, Placed, EmLayout, EmColOptions }
