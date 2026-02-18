// geometry elements

import { THEME } from '../lib/theme'
import { DEFAULTS as D, d2r } from '../lib/const'
import { is_boolean, is_scalar, is_array, ensure_vector, ensure_point, upright_rect, rounder, minimum, maximum, abs, cos, sin, rect_radial, sub_mpoint, squeeze_mpoint, mul, div, add, sub, zip, range, unit_direc } from '../lib/utils'

import { Context, Element, Group, Rectangle, prefix_split } from './core'

import type { Point, Limit, Attrs, MPoint, Orient, Rounded } from '../lib/types'
import type { ElementArgs, GroupArgs, RectArgs } from './core'

//
// line classes
//

interface LineArgs extends ElementArgs {
    points?: Point[]
    closed?: boolean
}

class Line extends Element {
    points: Point[]
    poly: boolean

    constructor(args: LineArgs = {}) {
        const { points, closed = false, ...attr } = THEME(args, 'Line')

        // check valid points
        if (points == null) throw new Error('Points are required')

        // use line tag for 2 points, polyline for more
        const poly = closed || points.length > 2
        const tag = closed ? 'polygon' : (poly ? 'polyline' : 'line')

        super({ tag, unary: true, ...attr })
        this.args = args

        // additional props
        this.points = points
        this.poly = poly
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        if (this.points.length < 2) return attr
        if (this.poly) {
            const pixels = this.points.map(p => ctx.mapPoint(p))
            const points = pointstring(pixels, ctx.prec)
            return { points, ...attr }
        } else {
            const [ p1, p2 ] = this.points
            const [ x1, y1 ] = ctx.mapPoint(p1)
            const [ x2, y2 ] = ctx.mapPoint(p2)
            return { x1, y1, x2, y2, ...attr }
        }
    }
}

interface UnitLineArgs extends LineArgs {
    direc?: Orient
    loc?: number
    lim?: Limit
}

class UnitLine extends Line {
    constructor(args: UnitLineArgs = {}) {
        const { direc = 'h', loc = D.loc, lim = D.lim, ...attr } = THEME(args, 'UnitLine')

        // construct line positions
        const [ lo, hi ] = lim
        const children = (direc == 'v') ?
            [ [ loc, lo ], [ loc, hi ] ] :
            [ [ lo, loc ], [ hi, loc ] ]

        // pass to Line
        super({ children, ...attr })
        this.args = args
    }
}

class VLine extends UnitLine {
    constructor(args: UnitLineArgs = {}) {
        const { ...attr } = THEME(args, 'VLine')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HLine extends UnitLine {
    constructor(args: UnitLineArgs = {}) {
        const { ...attr } = THEME(args, 'HLine')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

//
// shape classes
//

class Square extends Rectangle {
    constructor(args: RectArgs = {}) {
        const { ...attr } = THEME(args, 'Square')
        super({ aspect: 1, ...attr })
        this.args = args
    }
}

class Ellipse extends Element {
    constructor(args: ElementArgs = {}) {
        const { ...attr } = THEME(args, 'Ellipse')
        super({ tag: 'ellipse', unary: true, ...attr })
        this.args = args
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const { prect } = ctx
        let [ cx, cy, rx, ry ] = rect_radial(prect, true)
        return { cx, cy, rx, ry, ...attr }
    }
}

class Circle extends Ellipse {
    constructor(args: ElementArgs = {}) {
        const { ...attr } = THEME(args, 'Circle')
        super({ aspect: 1, ...attr })
        this.args = args
    }
}

interface DotArgs extends ElementArgs {
    color?: string
    stroke?: string
    fill?: string
}

class Dot extends Circle {
    constructor(args: DotArgs = {}) {
        const { color = 'black', stroke: stroke0, fill: fill0, ...attr } = THEME(args, 'Dot')
        const stroke = stroke0 ?? color
        const fill = fill0 ?? color
        super({ stroke, fill, ...attr })
        this.args = args
    }
}

interface RayArgs extends LineArgs {
    angle?: number
    loc?: Point
    size?: number | Point
}

class Ray extends Line {
    constructor(args: RayArgs = {}) {
        const { angle = 0, loc = D.pos, size = 0.5, ...attr } = THEME(args, 'Ray')
        const theta = angle * d2r
        const [ x, y ] = loc
        const [ rx, ry ] = ensure_vector(size, 2)
        const children = [
            [ x, y ],
            [ x + rx * cos(theta), y + ry * sin(theta) ]
        ]
        super({ children, ...attr })
        this.args = args
    }
}

//
// point strings
//

function pointstring(pixels: Point[], prec: number = D.prec): string {
    return pixels.map(([ x, y ]) =>
        `${rounder(x, prec)},${rounder(y, prec)}`
    ).join(' ')
}

class Pointstring extends Element {
    points: Point[]

    constructor(args: ElementArgs = {}) {
        const { tag, points, ...attr } = THEME(args, 'Pointstring')

        // pass to Element
        super({ tag, unary: true, ...attr })
        this.args = args

        // additional props
        this.points = points
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const pixels = this.points.map(p => ctx.mapPoint(p))
        const points = pointstring(pixels, ctx.prec)
        return { points, ...attr }
    }
}

class Shape extends Pointstring {
    constructor(args: ElementArgs = {}) {
        const attr = THEME(args, 'Shape')
        super({ tag: 'polygon', ...attr })
        this.args = args
    }
}

class Triangle extends Shape {
    constructor(args: ElementArgs = {}) {
        const attr = THEME(args, 'Triangle')
        const points = [[0.5, 0], [1, 1], [0, 1]]
        super({ points, ...attr })
        this.args = args
    }
}

//
// path classes
//

class Path extends Element {
    cmds: Command[]

    constructor(args: ElementArgs = {}) {
        const { children, ...attr } = THEME(args, 'Path')
        super({ tag: 'path', unary: true, ...attr })
        this.args = args
        this.cmds = children
    }

    data(ctx: Context): string {
        return this.cmds.map(c => c.data(ctx)).join(' ')
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const d = this.data(ctx)
        return { d, ...attr }
    }
}

// TODO: make Commands proper Elements so they work with React
class Command {
    cmd: string

    constructor(cmd: string) {
        this.cmd = cmd
    }

    args(_ctx: Context): string {
        return ''
    }

    data(ctx: Context): string {
        return `${this.cmd} ${this.args(ctx)}`
    }
}

class MoveCmd extends Command {
    pos: Point | MPoint

    constructor(pos: Point | MPoint) {
        super('M')
        this.pos = pos
    }

    args(ctx: Context): string {
        const [ x, y ] = ctx.mapPoint(this.pos)
        return `${rounder(x, ctx.prec)},${rounder(y, ctx.prec)}`
    }
}

class LineCmd extends Command {
    pos: Point | MPoint

    constructor(pos: Point | MPoint) {
        super('L')
        this.pos = pos
    }

    args(ctx: Context): string {
        const [ x, y ] = ctx.mapPoint(this.pos)
        return `${rounder(x, ctx.prec)},${rounder(y, ctx.prec)}`
    }
}

class ArcCmd extends Command {
    pos: Point
    rad: Point
    large: number
    sweep: number

    constructor(pos: Point, rad: Point, large: number, sweep: number) {
        super('A')
        this.pos = pos
        this.rad = rad
        this.large = large
        this.sweep = sweep
    }

    args(ctx: Context): string {
        const [ x1, y1 ] = ctx.mapPoint(this.pos)
        const [ rx, ry ] = ctx.mapSize(this.rad)
        return `${rounder(rx, ctx.prec)},${rounder(ry, ctx.prec)} 0 ${this.large} ${this.sweep} ${rounder(x1, ctx.prec)},${rounder(y1, ctx.prec)}`
    }
}

// this makes a rounded corner between two points
// the direction is by default counter-clockwise
// this assumes the cursor is at pos0
class CornerCmd {
    pos0: Point
    pos1: Point

    constructor(pos0: Point, pos1: Point) {
        this.pos0 = pos0
        this.pos1 = pos1
    }

    data(ctx: Context): string {
        const [ x0, y0 ] = ctx.mapPoint(this.pos0)
        const [ x1, y1 ] = ctx.mapPoint(this.pos1)

        // compute aspect ratio
        const [ dx, dy ] = [ Math.abs(x1 - x0), Math.abs(y1 - y0) ]
        const aspect = dx / dy

        // are we in quadrants 1/3 or 2/4?
        const [ top, right ] = [ x1 < x0, y1 < y0 ]
        const [ diag, wide ] = [ top == right, aspect > 1 ]

        // get corner point and fitted radius
        const [ cx, cy ] = diag ? [ x0, y1 ] : [ x1, y0 ]
        const rad = minimum(dx, dy)

        // get the intra-radial points
        const sigx = right ? -1 :  1
        const sigy = top   ?  1 : -1
        const [ x0p, y0p ] = diag ? [ cx, cy + sigy * rad ] : [ cx + sigx * rad, cy ]
        const [ x1p, y1p ] = diag ? [ cx + sigx * rad, cy ] : [ cx, cy + sigy * rad ]

        // full command
        return (
            ((diag != wide) ? `L ${rounder(x0p, ctx.prec)},${rounder(y0p, ctx.prec)} ` : '')
            + `A ${rounder(rad, ctx.prec)},${rounder(rad, ctx.prec)} 0 0 0 ${rounder(x1p, ctx.prec)},${rounder(y1p, ctx.prec)} `
            + ((diag == wide) ? `L ${rounder(x1, ctx.prec)},${rounder(y1, ctx.prec)} ` : '')
        )
    }
}

//
// spline class
//

interface CubicSplineCmdArgs {
    pos1?: Point | MPoint
    pos2?: Point | MPoint
    dir1?: Point
    dir2?: Point
    tan1?: Point
    tan2?: Point
    curve?: number
}

class CubicSplineCmd extends Command {
    pos1: Point | MPoint
    pos2: Point | MPoint
    dir1: Point | undefined
    dir2: Point | undefined
    tan1: Point | undefined
    tan2: Point | undefined
    curve: number

    constructor(args: CubicSplineCmdArgs = {}) {
        const { pos1, pos2, dir1, dir2, tan1, tan2, curve = 0.5 } = args ?? {}

        // pass to Command
        super('C')

        // additional props
        this.pos1 = pos1!
        this.pos2 = pos2!
        this.dir1 = dir1
        this.dir2 = dir2
        this.tan1 = tan1
        this.tan2 = tan2
        this.curve = curve
    }

    args(ctx: Context): string {
        // use dir if provided, otherwise use tan
        const dist = squeeze_mpoint(sub_mpoint(this.pos2, this.pos1)).map(abs)
        const tan1 = this.dir1 != null ? mul(this.dir1, dist) : this.tan1
        const tan2 = this.dir2 != null ? mul(this.dir2, dist) : this.tan2

        // compute scaled tangents
        const stan1 = mul(tan1, this.curve)
        const stan2 = mul(tan2, this.curve)

        // get mapped points and tangents
        const ppos1 = ctx.mapPoint(this.pos1)
        const ppos2 = ctx.mapPoint(this.pos2)
        const ptan1 = ctx.mapSize(stan1)
        const ptan2 = ctx.mapSize(stan2)

        // convert to Bernstein form
        const pcon1 = add(ppos1, div(ptan1, 3))
        const pcon2 = sub(ppos2, div(ptan2, 3))

        // make a path command
        return pointstring([pcon1, pcon2, ppos2], ctx.prec)
    }
}

interface SplineArgs extends ElementArgs {
    dir1?: Point
    dir2?: Point
    curve?: number
    closed?: boolean
}

class Spline extends Path {
    constructor(args: SplineArgs = {}) {
        const { points, dir1, dir2, curve, closed = false, ...attr } = THEME(args, 'Spline')

        // compute tangent directions at each point (cardinal spline)
        const n = points.length
        const tans = range(n).map(i => {
            const i1 = (closed && i == 0    ) ? n - 1 : maximum(0    , i - 1)
            const i2 = (closed && i == n - 1) ? 0     : minimum(n - 1, i + 1)
            return squeeze_mpoint(sub_mpoint(points[i2], points[i1]))
        })

        // create path commands
        const move = new MoveCmd(points[0])
        const num = maximum(0, closed ? n : n - 1)
        const splines = range(num).map(i => {
            const ip = (closed && i == num - 1) ? 0 : i + 1
            const d1 = (!closed && i == 0) ? dir1 : undefined
            const d2 = (!closed && i == num - 1) ? dir2 : undefined
            return new CubicSplineCmd({
                pos1: points[i], pos2: points[ip],
                tan1: tans[i], tan2: tans[ip],
                dir1: d1, dir2: d2, curve
            })
        })

        // pass to Path
        super({ children: [ move, ...splines ], ...attr })
        this.args = args
    }
}

//
// rounded rectangle class
//

function parse_rounded(rounded: Rounded): Point[] {
    if (is_boolean(rounded)) rounded = rounded ? 0.1 : 0
    if (is_scalar(rounded)) {
        rounded = [rounded, rounded, rounded, rounded]
    } else if (is_array(rounded) && rounded.length == 2) {
        const [ rx, ry ] = rounded
        rounded = [[rx, ry], [rx, ry], [rx, ry], [rx, ry]]
    }
    return rounded.map(ensure_point)
}

interface RoundedRectArgs extends ElementArgs {
    rounded?: Rounded | boolean
    border?: number
}

// supports different rounded for each corner (contra base Rectangle)
class RoundedRect extends Path {
    constructor(args: RoundedRectArgs = {}) {
        const { rounded = 0, border = 1, ...attr } = THEME(args, 'RoundedRect')

        // convert to array of arrays
        const [ rtl, rtr, rbr, rbl ] = parse_rounded(rounded)
        const [ rtlx, rtly ] = rtl
        const [ rtrx, rtry ] = rtr
        const [ rbrx, rbry ] = rbr
        const [ rblx, rbly ] = rbl

        // make command list
        const children = [
            new MoveCmd([1 - rtrx, 0]),
            new LineCmd([rtlx, 0]),
            new CornerCmd([rtlx, 0], [0, rtly]),
            new LineCmd([0, 1 - rbly]),
            new CornerCmd([0, 1 - rbly], [rblx, 1]),
            new LineCmd([1 - rbrx, 1]),
            new CornerCmd([1 - rbrx, 1], [1, 1 - rbry]),
            new LineCmd([1, rtry]),
            new CornerCmd([1, rtry], [1 - rtrx, 0]),
        ]

        // pass to Path
        super({ children, stroke_width: border, ...attr })
        this.args = args
    }

    // intercept prect and ensure its upright
    // otherwide CornerCmd will fail going counter-clockwise
    // TODO: could this be yet another spec property?
    props(ctx: Context): Attrs {
        const { prect: prect0 } = ctx
        const prect = upright_rect(prect0)
        const ctx1 = ctx.clone({ prect })
        return super.props(ctx1)
    }
}

//
// arrow classes
//

interface ArrowHeadArgs extends ElementArgs {
    direc?: number
    arc?: number
    base?: boolean
    exact?: boolean
    fill?: string
    stroke_width?: number
    stroke_linecap?: string
    stroke_linejoin?: string
}

class ArrowHead extends Path {
    constructor(args: ArrowHeadArgs = {}) {
        const { direc = 0, arc = 75, base: base0, exact = true, aspect, fill, stroke_width = 1, stroke_linecap = 'round', stroke_linejoin = 'round', ...attr } = THEME(args, 'ArrowHead')
        const base = base0 ?? (fill != null)

        // get arc positions
        const [ arc0, arc1, arc2 ] = [ -direc, -direc - arc / 2, -direc + arc / 2 ]
        const [ dir0, dir1, dir2 ] = [ arc0, arc1, arc2 ].map(unit_direc)

        // get vertex positions
        const off = exact ? mul(dir0, -0.5 * stroke_width) : [ 0, 0 ]
        const [ fra0, fra1, fra2 ] = [ [0, 0], dir1, dir2 ].map(d => add(mul(d, -0.5), D.pos) as Point)
        const [ pos0, pos1, pos2 ] = [ fra0, fra1, fra2 ].map(f => zip(f, off) as MPoint)

        // make command path
        const commands = fill == null ?
            [ new MoveCmd(pos0), new LineCmd(pos1), new MoveCmd(pos0), new LineCmd(pos2) ] :
            [ new MoveCmd(pos1), new LineCmd(pos0), new LineCmd(pos2) ]
        if (base) commands.push(new MoveCmd(pos1), new LineCmd(pos2))

        // pass to element
        super({ children: commands, aspect, fill, stroke_width, stroke_linecap, stroke_linejoin, ...attr })
        this.args = args
    }
}

interface ArrowArgs extends GroupArgs {
    direc?: number
    tail?: number
    stroke_width?: number
}

class Arrow extends Group {
    constructor(args: ArrowArgs = {}) {
        const { direc = 0, tail, stroke_width, ...attr0 } = THEME(args, 'Arrow')
        const [ head_attr, tail_attr, attr ] = prefix_split([ 'head', 'tail' ], attr0)

        // sort out direction
        const soff = 0.5 * (stroke_width ?? 1)
        const unit_vec = unit_direc(-direc)
        const children: Element[] = []

        // create tail element
        if (tail != null) {
            const tail_vec = unit_vec.map(z => -tail * z)
            const tail_off = mul(unit_vec, -soff)
            const tail_children = [
                zip(D.pos, tail_off),
                add(D.pos, tail_vec)
            ]
            const tail_elem = new Line({ children: tail_children, stroke_width, ...tail_attr })
            children.push(tail_elem)
        }

        // create head element
        const head_elem = new ArrowHead({ direc, stroke_width, ...head_attr })
        children.push(head_elem)

        // pass to Group
        super({ children, ...attr })
        this.args = args
    }
}

//
// exports
//

export { Line, UnitLine, VLine, HLine, Square, Ellipse, Circle, Dot, Ray, Pointstring, Shape, Triangle, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, RoundedRect, ArrowHead, Arrow }
export type { LineArgs, UnitLineArgs, DotArgs, RayArgs, SplineArgs, RoundedRectArgs, ArrowHeadArgs, ArrowArgs, CubicSplineCmdArgs }
