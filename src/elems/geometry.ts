// geometry elements

import { THEME } from '../lib/theme'
import { DEFAULTS as D, d2r } from '../lib/const'
import { is_boolean, is_scalar, is_array, ensure_vector, ensure_point, ensure_mnumber, ensure_mpoint, check_array, upright_rect, upright_limits, rounder, abs, rect_radial, make_mpoint, squeeze_mpoint, add2m, sub2m, add2, sub2, mul2, div2, clamp, range, angle_direc, unit_direc, vector_angle, polar, prefix_split } from '../lib/utils'

import { Context, Element, Group, Rectangle } from './core'

import type { Point, Limit, Grad, Attrs, MNumber, MPoint, Orient, Rounded, Direc } from '../lib/types'
import type { ElementArgs, GroupArgs, RectArgs } from './core'

//
// line classes
//

interface LineArgs extends ElementArgs {
    points?: (Point | MPoint)[]
    closed?: boolean
}

class Line extends Element {
    points: (Point | MPoint)[]
    poly: boolean

    constructor(args: LineArgs = {}) {
        const { points: points0, closed = false, ...attr } = THEME(args, 'Line')
        const points = check_array(points0)

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
        const points: Point[] = (direc == 'v') ?
            [ [ loc, lo ], [ loc, hi ] ] :
            [ [ lo, loc ], [ hi, loc ] ]

        // pass to Line
        super({ points, ...attr })
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

interface CoordLineArgs extends LineArgs {
    direc?: Orient
    line_width?: number
}

class CoordLine extends Line {
    direc: Orient
    line_width: number

    constructor(args: CoordLineArgs = {}) {
        const { direc = 'v', line_width = 0.03, ...attr } = args
        super(attr)
        this.args = args
        this.direc = direc
        this.line_width = line_width
    }

    props(ctx: Context): Attrs {
        const attr = super.props(ctx)
        const [ w, h ] = ctx.mapSize([this.line_width, this.line_width])
        const stroke_width = this.direc == 'v' ? h : w
        return { ...attr, stroke_width }
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
        const points: Point[] = [
            [ x, y ],
            polar([ [ rx, ry ], theta ], [ x, y ])
        ]
        super({ points, ...attr })
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

interface PointstringArgs extends ElementArgs {
    points?: Point[]
}

class Pointstring extends Element {
    points: Point[]

    constructor(args: PointstringArgs = {}) {
        const { tag, points: points0, ...attr } = THEME(args, 'Pointstring')
        const points = check_array(points0)

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
    constructor(args: PointstringArgs = {}) {
        const attr = THEME(args, 'Shape')
        super({ tag: 'polygon', ...attr })
        this.args = args
    }
}

class Triangle extends Shape {
    constructor(args: ElementArgs = {}) {
        const attr = THEME(args, 'Triangle')
        const points: Point[] = [[0.5, 0], [1, 1], [0, 1]]
        super({ points, ...attr })
        this.args = args
    }
}

//
// path classes
//

interface PathArgs extends ElementArgs {
    children?: Command[]
}

class Path extends Element {
    cmds: Command[]

    constructor(args: PathArgs = {}) {
        const { children = [], ...attr } = THEME(args, 'Path')
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
    large: boolean
    sweep: boolean

    constructor(pos: Point, rad: number | Point, sweep: boolean = true, large: boolean = false) {
        super('A')
        this.pos = pos
        this.rad = ensure_vector(rad, 2) as Point
        this.large = large
        this.sweep = sweep
    }

    args(ctx: Context): string {
        const [ x1, y1 ] = ctx.mapPoint(this.pos)
        const [ rx, ry ] = ctx.mapSize(this.rad).map(abs)
        return `${rounder(rx, ctx.prec)},${rounder(ry, ctx.prec)} 0 ${this.large ? 1 : 0} ${this.sweep ? 1 : 0} ${rounder(x1, ctx.prec)},${rounder(y1, ctx.prec)}`
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
        const rad = Math.min(dx, dy)

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
    dir1?: Point
    dir2?: Point
    tan1?: Point
    tan2?: Point
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
        const dist = squeeze_mpoint(sub2m(this.pos2, this.pos1)).map(abs) as Point
        const tan1 = this.dir1 != null ? mul2(this.dir1, dist) : this.tan1
        const tan2 = this.dir2 != null ? mul2(this.dir2, dist) : this.tan2
        if (tan1 == null || tan2 == null) throw new Error('Spline tangent must be defined')

        // compute scaled tangents
        const stan1 = mul2(tan1, this.curve)
        const stan2 = mul2(tan2, this.curve)

        // get mapped points and tangents
        const ppos1 = ctx.mapPoint(this.pos1)
        const ppos2 = ctx.mapPoint(this.pos2)
        const ptan1 = ctx.mapSize(stan1)
        const ptan2 = ctx.mapSize(stan2)

        // convert to Bernstein form
        const pcon1 = add2(ppos1, div2(ptan1, 3))
        const pcon2 = sub2(ppos2, div2(ptan2, 3))

        // make a path command
        return pointstring([pcon1, pcon2, ppos2], ctx.prec)
    }
}

//
// spline class
//

interface SplineFuncArgs {
    dir1?: Grad
    dir2?: Grad
    curve?: number
    closed?: boolean
}

function is_mpoint(point: Point | MPoint): point is MPoint {
    return is_array(point[0]) || is_array(point[1])
}

function mix_mnumber(v1: number | MNumber, v2: number | MNumber, t: number): MNumber {
    const [ x1, c1 ] = ensure_mnumber(v1)
    const [ x2, c2 ] = ensure_mnumber(v2)
    return [
        (1 - t) * x1 + t * x2,
        (1 - t) * c1 + t * c2,
    ]
}

function mix_mpoint(p1: Point | MPoint, p2: Point | MPoint, t: number): MPoint {
    const [ x1, y1 ] = ensure_mpoint(p1)
    const [ x2, y2 ] = ensure_mpoint(p2)
    return [
        mix_mnumber(x1, x2, t),
        mix_mnumber(y1, y2, t),
    ]
}

function cubic_spline_tans(points: (Point | MPoint)[], closed: boolean = false): Point[] {
    const n = points.length
    return range(n).map(i => {
        const i1 = (closed && i == 0    ) ? n - 1 : Math.max(0    , i - 1)
        const i2 = (closed && i == n - 1) ? 0     : Math.min(n - 1, i + 1)
        return squeeze_mpoint(sub2m(points[i2], points[i1]))
    })
}

function cubic_spline_points(args: CubicSplineCmdArgs = {}): [MPoint, MPoint, MPoint, MPoint] {
    const { pos1, pos2, dir1, dir2, tan1, tan2, curve = 0.5 } = args ?? {}
    if (pos1 == null || pos2 == null) throw new Error('Spline endpoints must be defined')

    // use dir if provided, otherwise use tan
    const dist = squeeze_mpoint(sub2m(pos2, pos1)).map(abs) as Point
    const tan1a = dir1 != null ? mul2(dir1, dist) as Point : tan1
    const tan2a = dir2 != null ? mul2(dir2, dist) as Point : tan2
    if (tan1a == null || tan2a == null) throw new Error('Spline tangent must be defined')

    // compute scaled tangents and Bernstein controls in spline coordinates
    const stan1 = div2(mul2(tan1a, curve), 3) as Point
    const stan2 = div2(mul2(tan2a, curve), 3) as Point
    const cpos1 = ensure_mpoint(pos1)
    const cpos2 = ensure_mpoint(pos2)
    const con1 = add2m(cpos1, stan1)
    const con2 = sub2m(cpos2, stan2)

    return [ cpos1, con1, con2, cpos2 ]
}

function cubic_bezier_point(points: [Point | MPoint, Point | MPoint, Point | MPoint, Point | MPoint], t: number): MPoint {
    const [ p0, p1, p2, p3 ] = points
    const q0 = mix_mpoint(p0, p1, t)
    const q1 = mix_mpoint(p1, p2, t)
    const q2 = mix_mpoint(p2, p3, t)
    const r0 = mix_mpoint(q0, q1, t)
    const r1 = mix_mpoint(q1, q2, t)
    return mix_mpoint(r0, r1, t)
}

function make_spline(points: Point[], args?: SplineFuncArgs): (t: number) => Point
function make_spline(points: (Point | MPoint)[], args?: SplineFuncArgs): (t: number) => Point | MPoint
function make_spline(points0: (Point | MPoint)[], args: SplineFuncArgs = {}): (t: number) => Point | MPoint {
    const { dir1, dir2, curve, closed = false } = args
    const points = check_array(points0)
    const has_mpoint = points.some(is_mpoint)
    const n = points.length

    if (n < 2) throw new Error('Spline must have at least two points')

    const tans = cubic_spline_tans(points, closed)
    const num = Math.max(0, closed ? n : n - 1)
    const splines = range(num).map(i => {
        const ip = (closed && i == num - 1) ? 0 : i + 1
        const d1 = (!closed && i == 0) ? dir1 : undefined
        const d2 = (!closed && i == num - 1) ? dir2 : undefined
        return cubic_spline_points({
            pos1: points[i], pos2: points[ip],
            tan1: tans[i], tan2: tans[ip],
            dir1: d1, dir2: d2, curve,
        })
    })

    return (t: number) => {
        const t1 = clamp(t, [ 0, 1 ])
        const [ i, u ] = (t1 >= 1) ?
            [ num - 1, 1 ] :
            [ Math.floor(t1 * num), t1 * num % 1 ]
        const point = cubic_bezier_point(splines[i], u)
        return has_mpoint ? point : squeeze_mpoint(point)
    }
}

interface SplineArgs extends ElementArgs {
    points?: (MPoint | Point)[]
    dir1?: Grad
    dir2?: Grad
    curve?: number
    closed?: boolean
}

class Spline extends Path {
    constructor(args: SplineArgs = {}) {
        const { points: points0, dir1, dir2, curve, closed = false, ...attr } = THEME(args, 'Spline')
        const points = check_array(points0)

        // compute tangent directions at each point (cardinal spline)
        const n = points.length
        const tans = cubic_spline_tans(points, closed)

        // create path commands
        const move = new MoveCmd(points[0])
        const num = Math.max(0, closed ? n : n - 1)
        const splines = range(num).map(i => {
            const ip = (closed && i == num - 1) ? 0 : i + 1
            const d1 = (!closed && i == 0) ? dir1 : undefined
            const d2 = (!closed && i == num - 1) ? dir2 : undefined
            return new CubicSplineCmd({
                pos1: points[i], pos2: points[ip],
                tan1: tans[i], tan2: tans[ip],
                dir1: d1, dir2: d2, curve,
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
// arc classe
//

interface ArcArgs extends ElementArgs {
    start?: number
    end?: number
}

class Arc extends Path {
    constructor(args: ArcArgs = {}) {
        const { start, end, upright = true, ...attr } = THEME(args, 'Arc')
        if (start == null || end == null) throw new Error('Must provide `start` and `end` angles')
        const [ theta0, theta1 ] = upright_limits([ start, end ])
        const large = (theta1 - theta0) > 180
        const [ point0, point1 ] = [ theta0, theta1 ].map(t => polar([0.5, t], [0.5, 0.5]))
        const children = [ new MoveCmd(point0), new ArcCmd(point1, 0.5, true, large) ]
        super({ children, upright, ...attr })
        this.args = args
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
}

class ArrowHead extends Path {
    constructor(args: ArrowHeadArgs = {}) {
        const { angle = 0, arc = 75, base: base0, exact = true, aspect = 1, fill, stroke_width = 1, stroke_linecap = 'round', stroke_linejoin = 'round', rotate: _rotate, spin: _spin, invar: _invar, rotate_adjust: _rotate_adjust, ...attr } = THEME(args, 'ArrowHead')
        const base = base0 ?? (fill != null)

        // orient the head pointing right
        const [ arc0, arc1, arc2 ] = [ 0, -arc / 2, arc / 2 ]
        const [ dir0, dir1, dir2 ] = [ arc0, arc1, arc2 ].map(angle_direc)

        // get vertex positions
        const off: Point = exact ? mul2(dir0, -0.5 * stroke_width) : [ 0, 0 ]
        const fracs: Point[] = [ [0, 0], dir1, dir2 ]
        const [ fra0, fra1, fra2 ] = fracs.map(d => add2(mul2(d, -0.5), D.pos))
        const [ pos0, pos1, pos2 ] = [ fra0, fra1, fra2 ].map(f => make_mpoint(f, off))

        // make command path
        const commands = fill == null ?
            [ new MoveCmd(pos0), new LineCmd(pos1), new MoveCmd(pos0), new LineCmd(pos2) ] :
            [ new MoveCmd(pos1), new LineCmd(pos0), new LineCmd(pos2) ]
        if (base) commands.push(new MoveCmd(pos1), new LineCmd(pos2))

        // pass to element
        super({ children: commands, aspect, fill, stroke_width, stroke_linecap, stroke_linejoin, orient: -angle, ...attr })
        this.args = args
    }
}

interface ArrowArgs extends GroupArgs {
    points?: Point[]
    start?: Point
    end?: Point
    start_dir?: Direc
    end_dir?: Direc
    arrow?: boolean
    arrow_start?: boolean
    arrow_end?: boolean
    arrow_size?: number
    curve?: number
}

class Arrow extends Group {
    constructor(args: ArrowArgs = {}) {
        const { points, start_dir, end_dir, arrow_size = 0.04, arrow, arrow_start: arrow_start0 = false, arrow_end: arrow_end0 = true, curve, stroke_width = 1, stroke_linecap, fill, coord, ...attr0 } = THEME(args, 'Arrow')
        const [ line_attr0, arrow_attr0, start_attr0, end_attr0, attr ] = prefix_split([ 'line', 'arrow', 'start', 'end' ], attr0)

        // arrow defaults
        const arrow_start = arrow ?? arrow_start0
        const arrow_end   = arrow ?? arrow_end0

        // accumulate arguments
        const stroke_attr = { stroke_width, stroke_linecap }
        const line_attr = { ...stroke_attr, ...line_attr0 }
        const arrow_attr = { fill, ...stroke_attr, ...arrow_attr0 }
        const start_attr = { ...arrow_attr, ...start_attr0 }
        const end_attr = { ...arrow_attr, ...end_attr0 }

        // check for points
        if (points == null) throw new Error('Must provide `points`')

        // check for points
        const [ start, start_pre, end_pre, end ] = [ points[0], points[1], points[points.length-2], points[points.length-1] ]
        if (start == null || end == null) throw new Error('Must provide both `start` and `end` points')

        // get the stroke offset
        const stroke_offset = 0.5 * stroke_width

        // infer the from arrow direction
        const start_direc = unit_direc(start_dir ?? sub2(start_pre, start))
        const start_angle = 180 - vector_angle(start_direc)
        const start_pos = make_mpoint(start, mul2(start_direc, stroke_offset))

        // infer the to arrow direction
        const end_direc = unit_direc(end_dir ?? sub2(end, end_pre))
        const end_angle = -vector_angle(end_direc)
        const end_pos = make_mpoint(end, mul2(end_direc, -stroke_offset))

        // make line path
        const points_adj = [ start_pos, ...points.slice(1, -1), end_pos ]
        const line_elem = curve ?
            new Spline({ points: points_adj, dir1: start_direc, dir2: end_direc, curve, coord, ...line_attr }) :
            new Line({ points: points_adj, coord, ...line_attr })

        // make arrowheads
        const start_elem = arrow_start ? new ArrowHead({ angle: start_angle, pos: start, rad: arrow_size, ...start_attr }) : null
        const end_elem = arrow_end ? new ArrowHead({ angle: end_angle, pos: end, rad: arrow_size, ...end_attr }) : null

        // pass to Group
        super({ children: [ line_elem, start_elem, end_elem ], coord, ...attr })
        this.args = args
    }
}

//
// exports
//

export { Line, UnitLine, VLine, HLine, CoordLine, Square, Ellipse, Arc, Circle, Dot, Ray, Pointstring, Shape, Triangle, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, make_spline, Spline, RoundedRect, ArrowHead, Arrow }
export type { LineArgs, UnitLineArgs, CoordLineArgs, ArcArgs, DotArgs, RayArgs, SplineArgs, RoundedRectArgs, ArrowHeadArgs, ArrowArgs, CubicSplineCmdArgs, SplineFuncArgs }
