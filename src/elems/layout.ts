// layout components

import { THEME } from '../lib/theme.js'
import { DEFAULTS as D, none } from '../lib/const.js'
import { is_scalar, maximum, minimum, ensure_array, ensure_vector, ensure_point, log, exp, max, sum, zip, cumsum, reshape, repeat, meshgrid, padvec, normalize, mean, identity, invert, aspect_invariant, check_singleton, rect_center, rect_radius, div, join_limits, radial_rect } from '../lib/utils.js'
import { wrapWidths } from '../lib/text.js'

import { Context, Group, Element, Rectangle, prefix_split, spec_split, align_frac } from './core.js'
import { RoundedRect, Dot, Arrow } from './geometry.js'

import type { Point, Rect, Limit, AlignValue, Side, Orient, Padding, Rounded } from '../lib/types.js'
import type { ElementArgs, GroupArgs } from './core.js'

//
// args interfaces
//

interface BoxArgs extends GroupArgs {
    padding?: Padding
    margin?: Padding
    border?: boolean | number
    fill?: string
    shape?: Element
    rounded?: Rounded
    adjust?: boolean
}

interface StackArgs extends GroupArgs {
    direc?: Orient
    spacing?: boolean | number
    justify?: AlignValue
    even?: boolean
}

interface HWrapArgs extends StackArgs {
    padding?: number
    wrap?: number
    measure?: (c: Element) => number
}

interface GridArgs extends GroupArgs {
    rows?: number
    cols?: number
    widths?: number[]
    heights?: number[]
    spacing?: number | Point
}

interface PointsArgs extends GroupArgs {
    shape?: Element
    size?: number
}

interface AnchorArgs extends GroupArgs {
    direc?: Orient
    loc?: number
    justify?: AlignValue
}

interface AttachArgs extends GroupArgs {
    offset?: number
    size?: number
    side?: Side
}

interface AbsoluteArgs extends ElementArgs {
    size?: number | Point
}

interface FieldArgs extends GroupArgs {
    shape?: Element
    size?: number
    tail?: number
}

//
// utils
//

function maybe_rounded_rect(rounded: Rounded | undefined): Element {
    if (rounded == null) {
        return new Rectangle()
    } else {
        return new RoundedRect({ rounded })
    }
}

function pad_rect(p: any): Rect {
    if (p == null) {
        return [ 0, 0, 0, 0 ]
    } else if (is_scalar(p)) {
        return [ p, p, p, p ]
    } else if (p.length == 2) {
        const [ px, py ] = p
        return [ px, py, px, py ]
    } else {
        return p
    }
}

// map padding/margin into internal boxes
function apply_padding(padding: Rect, aspect0: number | undefined): { rect: Rect, aspect: number | undefined } {
    const [ pl, pt, pr, pb ] = padding
    const [ pw, ph ] = [ pl + 1 + pr, pt + 1 + pb ]
    const rect = [ pl / pw, pt / ph, 1 - pr / pw, 1 - pb / ph ] as Rect
    const aspect = (aspect0 != null) ? aspect0 * (pw / ph) : undefined
    return { rect, aspect }
}

//
// box/frame
//

function computeBoxLayout(children: Element[], { padding, margin, aspect, adjust = true }: { padding?: any, margin?: any, aspect?: number | undefined, adjust?: boolean } = {}) {
    // try to determine box aspect
    const aspect_child = aspect ?? children[0]?.spec?.aspect

    // handle all null case
    if (padding == null && margin == null) {
        return {
            rect_inner: D.rect, rect_outer: D.rect,
            aspect_inner: aspect_child, aspect_outer: aspect_child
        }
    }

    // apply padding to outer rect
    let padding1 = pad_rect(padding)
    if (adjust && aspect_child != null) padding1 = aspect_invariant(padding1, 1 / aspect_child) as Rect
    const { rect: rect_inner, aspect: aspect_inner } = apply_padding(padding1, aspect_child)

    // apply margin to global rect
    let margin1 = pad_rect(margin)
    if (adjust && aspect_inner != null) margin1 = aspect_invariant(margin1, 1 / aspect_inner) as Rect
    const { rect: rect_outer, aspect: aspect_outer } = apply_padding(margin1, aspect_inner)

    // return inner/outer rects and aspect
    return { rect_inner, rect_outer, aspect_inner, aspect_outer: aspect ?? aspect_outer }
}

class Box extends Group {
    constructor(args: BoxArgs = {}) {
        let { children: children0, padding, margin, border, fill, shape, rounded, aspect, clip = false, adjust = true, debug = false, ...attr0 } = THEME(args, 'Box')
        const children = ensure_array(children0)
        const [ border_attr, fill_attr, attr] = prefix_split([ 'border', 'fill' ], attr0)

        // ensure shape is a function
        shape ??= maybe_rounded_rect(rounded)

        // compute layout
        const { rect_inner, rect_outer, aspect_outer } = computeBoxLayout(children, { padding, margin, aspect: aspect as number | undefined, adjust })

        // make framing elements
        const rect_cl = clip ? shape : false
        const rect_bg = fill != null ? shape.clone({ fill, stroke: none, ...fill_attr }) : null
        const rect_fg = border != null ? shape.clone({ stroke_width: border, ...border_attr }) : null

        // make inner groups
        const inner = new Group({ children, rect: rect_inner, debug })
        const outer = new Group({ children: [ rect_bg, inner, rect_fg ], rect: rect_outer, clip: rect_cl })

        // pass to Group
        super({ children: outer, aspect: aspect_outer, ...attr })
        this.args = args
    }
}

class Frame extends Box {
    constructor(args: BoxArgs = {}) {
        const { border = 1, ...attr } = THEME(args, 'Frame')
        super({ border, ...attr })
        this.args = args
    }
}

//
// stack/wrap/grid
//

type StackChildOver = {
    size: number
    aspect: number
}

type StackChildExpo = {
    size?: number
    aspect: number
}

type StackChildFlex = {
    size: number
    aspect: undefined
}

type StackChild = StackChildOver | StackChildExpo | StackChildFlex

// TODO: better justify handling with aspect override (right now it's sort of "left" justified)
function computeStackLayout(direc: string, children: Element[], { spacing = 0, even = false, aspect: aspect0 }: { spacing?: number, even?: boolean, aspect?: number } = {}): { ranges: Limit[], aspect: number | undefined } {
    // short circuit if empty
    if (children.length == 0) return { ranges: [], aspect: undefined }

    // get size and aspect data from children
    // adjust for direction (invert aspect if horizontal)
    const items = children.map(c => {
        const size = c.attr.stack_size ?? (even ? 1 / children.length : null)
        const expd = c.attr.stack_expand ?? true
        const aspect = expd ? c.spec.aspect : undefined
        return { size, aspect } as StackChild
    })

    // handle horizontal case (invert aspect)
    if (direc == 'v') {
        for (const c of items) c.aspect = invert(c.aspect)
    }

    // compute total share of non-spacing elements
    const F_total = 1 - spacing * (children.length - 1)

    // for computing return values
    const getSizes = (cs: StackChild[]): number[] => cs.map(c => c.size ?? 0)
    const getAspect0: (a: number | undefined) => number | undefined = (direc == 'v') ? invert : identity
    const getAspect = (a: number | undefined): number | undefined => (aspect0 ?? getAspect0(a))

    // compute ranges with spacing
    function getRanges(sizes0: number[]): Limit[] {
        const sizes1 = sizes0.map(s0 => F_total * s0)
        const bases = cumsum(sizes1.map(s1 => s1 + spacing)).slice(0, -1)
        return zip(bases, sizes1).map(([b, s1]) => [b, b + s1])
    }

    // children = list of dicts with keys size (s_i) and aspect (a_i)
    // const fixed = children.filter(c => c.size != null && c.aspect == null)
    const over = items.filter(c => c.size != null && c.aspect != null) as StackChildOver[]
    const expo = items.filter(c => c.size == null && c.aspect != null) as StackChildExpo[]
    const flex = items.filter(c => c.size == null && c.aspect == null) as StackChildFlex[]

    // get target aspect from over-constrained children
    // this is generically imperfect if len(over) > 1
    // single element case (exact): s * F_total * L = a
    // multi element case (approximate): agg(s_i / a_i) * F_total * L = 1
    const agg: (x: number[]) => number = x => max(x) as number // fit to max aspect, otherwise will underfit
    const L_over = (over.length > 0) ? 1 / (F_total * agg(over.map(c => c.size / c.aspect))) : undefined

    // knock out (over/exactly)-budgeted case right away
    // short-circuit since this is relatively simple
    const S_sum = sum(getSizes(items))
    if (S_sum >= 1 || (expo.length == 0 && flex.length == 0)) {
        const sizes = getSizes(items)
        const ranges = getRanges(sizes)
        const aspect = getAspect(L_over)
        return { ranges, aspect }
    }

    // set length to maximally accommodate over-constrained children (or expandables)
    // add up lengths required to make expandables height 1 (w = a)
    // set length to satisfy: L_expand * (1 - S_sum) * F_total = sum(w) = sum(a)
    const L_expand = (expo.length > 0) ? sum(expo.map(c => c.aspect)) / ((1 - S_sum) * F_total) : undefined
    const L_target = aspect0 ?? ((over.length > 0) ? L_over : L_expand) as number

    // allocate space to expand then flex children
    // S_exp0 gets full length of expandables given realized L_target
    // S_exp is the same but constrained so the sums are less than 1
    // should satisfy: s * F_total * L_target = a
    const S_exp0 = sum(expo.map(c => c.aspect / (F_total * L_target)))
    const S_exp = minimum(S_exp0, 1 - S_sum)
    const scale = S_exp / S_exp0 // this is 1 in the unconstrained case
    for (const c of expo) c.size = c.aspect / (F_total * L_target) * scale

    // distribute remaining space to flex children, if any
    // S_left is the remaining space after pre-allocated and expandables (may hit 0)
    const S_left = 1 - S_sum - S_exp
    if (flex.length > 0) {
        for (const c of flex) c.size = S_left / flex.length
    }

    // compute heights and aspect
    const sizes = getSizes(items)
    const ranges = getRanges(sizes)
    const aspect = getAspect(L_target)
    return { ranges, aspect }
}

// expects list of Element or [Element, height]
// this is written as vertical, horizonal swaps dimensions and inverts aspects
// TODO: make native way to mimic using Spacer elements for spacing
class Stack extends Group {
    constructor(args: StackArgs = {}) {
        let { children, direc = 'v', spacing = 0, justify = 'center', aspect: aspect0, even = false, ...attr } = THEME(args, 'Stack')
        children = ensure_array(children)

        // compute layout
        const spacing1 = (spacing as number) / maximum(children.length - 1, 1)
        const { ranges, aspect } = computeStackLayout(direc, children, { spacing: spacing1, even, aspect: aspect0 as number | undefined })

        // assign child rects
        children = children.length > 0 ? zip(children, ranges).map(([c, b]) => {
            const rect = join_limits({ [direc]: b })
            const align = c.spec.align ?? justify
            return c.clone({ rect, align })
        }) : []

        // pass to Group
        super({ children, aspect, ...attr })
        this.args = args
    }
}

class VStack extends Stack {
    constructor(args: StackArgs = {}) {
        const { ...attr } = THEME(args, 'VStack')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HStack extends Stack {
    constructor(args: StackArgs = {}) {
        const { ...attr } = THEME(args, 'HStack')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

function default_measure(c: Element): number {
    return c.spec.aspect ?? 1
}

// like stack but wraps elements to multiple lines/columns
class HWrap extends VStack {
    constructor(args: HWrapArgs = {}) {
        const { children: children0, spacing = 0, padding = 0, wrap, justify = 'left', measure: measure0, debug, ...attr } = THEME(args, 'HWrap')
        const children = ensure_array(children0)
        const measure = measure0 ?? default_measure

        // make HStack rows
        const { rows } = wrapWidths(children, measure, wrap)
        const lines = rows.map(row => new HStack({ children: row, spacing: padding, align: justify, debug }))
        const boxes = lines.map(line => new Group({ children: line, aspect: wrap ?? line.spec.aspect }))

        // pass to VStack
        super({ children: boxes, spacing, even: true, debug, ...attr })
        this.args = args
    }
}

/* grid layout and aspect computation (grok)
\log(\mu) = \frac{1}{M N} \sum_{i=1}^M \sum_{j=1}^N \log a_{ij}
\log(u)_j = \frac{1}{M} \sum_{i=1}^M \log a_{ij} - \log(\mu)
\log(v)_i = \log(\mu) - \frac{1}{N} \sum_{j=1}^N \log a_{ij}
w_j = \frac{u_j}{\sum_{k=1}^N u_k}
h_i = \frac{v_i}{\sum_{k=1}^M v_k}
\log(a) = \log(\mu) - \frac{1}{N} \sum_{j=1}^N \log(w_j) + \frac{1}{M} \sum_{i=1}^M \log(h_i)
*/

function computeGridLayout(children: Element[][], rows: number, cols: number, { widths: widths0, heights: heights0, spacing = 0 }: { widths?: number[], heights?: number[], spacing?: number | [number, number] } = {}): { cranges: Limit[], rranges: Limit[], aspect: number } {
    // aggregate aspect ratios along rows and columns (assuming null goes to 1)
    const aspect_grid = children.map(row => row.map(e => e.spec.aspect ?? 1))
    const log_aspect = aspect_grid.map(row => row.map(log))

    // these are exact for equipartitioned grids (row or column)
    const log_mu = mean(log_aspect.map(row => mean(row)))
    const log_uj = zip(...log_aspect).map(mean).map(x => x - log_mu)
    const log_vi = log_aspect.map(mean).map(x => log_mu - x)

    // implement findings
    let widths = widths0 ?? normalize(log_uj.map(exp))
    let heights = heights0 ?? normalize(log_vi.map(exp))
    const aspect_ideal = exp(log_mu - mean(widths.map(log)) + mean(heights.map(log)))

    // adjust widths and heights to account for spacing
    const [spacex, spacey] = ensure_point(spacing)
    const [scalex, scaley] = [1 - spacex * (cols-1), 1 - spacey * (rows-1)]
    widths = widths.map(w => scalex * w)
    heights = heights.map(h => scaley * h)
    const aspect = (1-spacey*(rows-1))/(1-spacex*(cols-1)) * aspect_ideal

    // get top left positions
    const lposit = cumsum(widths.map(w => w + spacex))
    const tposit = cumsum(heights.map(h => h + spacey))
    const cranges = zip(lposit, widths).map(([l, w]) => [l, l + w] as Limit)
    const rranges = zip(tposit, heights).map(([t, h]) => [t, t + h] as Limit)

    return { cranges, rranges, aspect }
}

function computeGridSize(num: number, rows: number | undefined, cols: number | undefined): { rows: number, cols: number } {
    if (rows == null && cols != null) {
        rows = Math.ceil(num / cols)
    } else if (cols == null && rows != null) {
        cols = Math.ceil(num / rows)
    } else if (rows == null && cols == null) {
        throw new Error('Either rows or cols must be specified')
    } else {}
    return { rows: rows as number, cols: cols as number }
}

class Grid extends Group {
    constructor(args: GridArgs = {}) {
        let { children: children0, rows: rows0, cols: cols0, widths, heights, spacing, aspect, ...attr } = THEME(args, 'Grid')
        const items = ensure_array(children0)

        // reshape children to grid
        const { rows, cols } = computeGridSize(items.length, rows0, cols0)
        let grid = reshape(items, [rows, cols])

        // fill in missing rows and columns
        const spacer = new Spacer()
        const filler = repeat(spacer, cols)
        grid = grid.map(row => padvec(row, cols, spacer))
        grid = padvec(grid, rows, filler)

        // compute layout
        const { cranges, rranges, aspect: aspect_ideal } = computeGridLayout(grid, rows, cols, { widths, heights, spacing })
        aspect ??= aspect_ideal

        // make grid
        const rects = meshgrid(rranges, cranges).map(([ ylim, xlim ]) =>
            join_limits({ h: xlim, v: ylim })
        )
        const children = zip(items, rects).map(([ child, rect ]) =>
            child.clone({ rect })
        )

        // pass to Group
        super({ children, aspect, ...attr })
        this.args = args
    }
}

//
// placement
//

class Points extends Group {
    constructor(args: PointsArgs = {}) {
        const { children: children0, shape: shape0, size = D.point, ...attr0 } = THEME(args, 'Points')
        const [ spec, attr ] = spec_split(attr0)
        const shape = shape0 ?? new Dot(attr)
        const points = ensure_array(children0)
        const children = points.map(pos => shape.clone({ pos, rad: size }))
        super({ children, ...spec })
        this.args = args
    }
}

class Anchor extends Group {
    constructor(args: AnchorArgs = {}) {
        const { children: children0, direc = 'h', loc: loc0, justify = 'center', ...attr } = args
        const child = check_singleton(children0)

        // assign spec to child
        const frac = align_frac(loc0 ?? justify)
        const children = child.clone({
            rect: join_limits({ [direc]: [ frac, frac ] }),
            align: justify,
            expand: true,
        })

        // pass to Group
        super({ children, ...attr })
        this.args = args
    }
}

class Attach extends Group {
    constructor(args: AttachArgs = {}) {
        const { children: children0, offset = 0, size = 1, align = 'center', side = 'top', ...attr } = THEME(args, 'Attach')
        const child = check_singleton(children0)

        // get extent and map
        const extent = size + offset
        const rmap = {
            'left': [ -extent, 0, -offset, 1 ], 'right' : [ 1+offset, 0, 1+extent, 1 ],
            'top' : [ 0, -extent, 1, -offset ], 'bottom': [ 0, 1+offset, 1, 1+extent ],
        }

        // assign spec to child
        const children = child.clone({
            rect: rmap[side],
            align,
        })

        // pass to Group
        super({ children, ...attr })
        this.args = args
    }
}

class Absolute extends Element {
    child: Element
    size?: number | Point

    constructor(args: AbsoluteArgs = {}) {
        const { children: children0, size, ...attr } = THEME(args, 'Absolute')
        const child = check_singleton(children0)

        // pass to Element
        super({ tag: 'g', unary: false, ...attr })
        this.args = args

        // additional props
        this.child = child
        this.size = size
    }

    inner(ctx: Context): string {
        const { prect } = ctx

        // get relative size from absolute size
        const pcent = rect_center(prect)
        const pradi = rect_radius(prect)
        const psize = ensure_vector(this.size, 2)
        const rect = radial_rect(pcent, div(psize, pradi))

        // render child element
        const ctx1 = ctx.map({ ...this.child.spec, rect })
        return this.child.svg(ctx1)
    }
}

class Field extends Group {
    constructor(args: FieldArgs = {}) {
        const { children: children0, shape: shape0, size = D.point, tail = 1, ...attr0 } = THEME(args, 'Field')
        const points = ensure_array(children0)
        const shape = shape0 ?? new Arrow({ tail })
        const [ spec, attr ] = spec_split(attr0)

        // create children
        const children = points.map(([ p, d ]) =>
            shape.clone({ pos: p, rad: size, spin: d, ...attr })
        )

        // pass to Group
        super({ children, ...spec })
        this.args = args
    }
}

// this can have an aspect, which is utilized by layouts
class Spacer extends Element {
    constructor(args: ElementArgs = {}) {
        const { ...attr } = THEME(args, 'Spacer')
        super({ tag: 'g', unary: true, ...attr })
        this.args = args
    }

    svg(ctx?: Context): string {
        return ''
    }
}

export { Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Field, Spacer }
export type { BoxArgs, StackArgs, HWrapArgs, GridArgs, PointsArgs, AnchorArgs, AttachArgs, AbsoluteArgs, FieldArgs }
