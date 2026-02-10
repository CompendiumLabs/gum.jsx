// symbolic elements

import { THEME } from '../lib/theme'
import { DEFAULTS as D } from '../lib/const'
import { zip, linspace, ensure_function, ensure_singleton, detect_coords, resolve_limits, is_scalar, vector_angle, enumerate, lingrid } from '../lib/utils'

import { Group, spec_split } from './core'
import { Line, Spline, Shape, Arrow, Dot } from './geometry'
import { Box } from './layout'

import type { Point, Limit, Rect } from '../lib/types'
import type { ElementArgs, GroupArgs } from './core'
import type { LineArgs, SplineArgs } from './geometry'

// GRAPHABLE ELEMENTS: SymPoints, SymLine, SymShape, SymSpline, SymFill, SymField
// these should take xlim/ylim/coord and give precedence to xlim/ylim over coord
// they should compute their coordinate limits and report them in coord (for Graph)

//
// args interfaces
//

interface SymArgsBase {
    xlim?: Limit
    ylim?: Limit
    tlim?: Limit
    xvals?: number[]
    yvals?: number[]
    tvals?: number[]
    N?: number
}

interface SymArgs extends SymArgsBase {
    fx?: ((t: number) => number)
    fy?: ((t: number) => number)
}

interface SymLineArgs extends SymArgs, LineArgs {
}

interface SymPointsArgs extends SymArgs, GroupArgs {
    size?: number | ((x: number, y: number, t: number, i: number) => number)
    shape?: any
}

interface SymSplineArgs extends SymArgs, SplineArgs {
}

interface SymShapeArgs extends SymArgs, ElementArgs {
}

interface SymFillArgs extends SymArgsBase, GroupArgs {
    fx1?: ((t: number) => number)
    fy1?: ((t: number) => number)
    fx2?: ((t: number) => number)
    fy2?: ((t: number) => number)
}

interface SymFieldArgs extends SymArgs, GroupArgs {
    func?: (x: number, y: number) => number | Point
}

// determines actual values given combinations of limits, values, and functions
function sympath({ fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N }: SymArgs = {}): [number[], number[], number[]] {
    fx = ensure_function(fx)
    fy = ensure_function(fy)

    // handle underspecified case
    if (
        tlim == null && tvals == null &&
        xlim == null && xvals == null &&
        ylim == null && yvals == null
    ) {
        return [ [], [], [] ]
    }

    // determine data size
    const Ns = new Set(
        [ tvals, xvals, yvals ]
        .filter(v => v != null)
        .map(v => v.length)
    )
    if (Ns.size > 1) {
        throw new Error(`Error: data sizes must be in aggreement but got ${[...Ns]}`)
    } else if (Ns.size == 1) {
        N = [...Ns][0]
    } else {
        N = N ?? D.N
    }

    // generate tvals
    tlim = tlim ?? D.lim
    tvals = tvals ?? linspace(...tlim, N)

    // compute data values
    if (fx != null && fy != null) {
        xvals = tvals.map(fx)
        yvals = tvals.map(fy)
    } else if (fy != null && xlim != null) {
        xvals ??= linspace(...xlim, N)
        yvals = xvals.map(fy)
    } else if (fx != null && ylim != null) {
        yvals ??= linspace(...ylim, N)
        xvals = yvals.map(fx)
    } else if (yvals != null && xvals == null) {
        xlim ??= D.lim
        xvals = linspace(...xlim, N)
    } else if (xvals != null && yvals == null) {
        ylim ??= D.lim
        yvals = linspace(...ylim, N)
    } else if (xvals == null || yvals == null) {
        throw new Error('Invalid input combination')
    }

    // filter out nan values
    const data = zip(tvals, xvals, yvals).filter(
        ([t, x, y]: number[]) => !isNaN(t) && !isNaN(x) && !isNaN(y)
    )

    // return dataset
    return zip(...data) as [number[], number[], number[]]
}

// a component is a function that returns an element
function ensure_shapefunc(f: any): (...a: any[]) => any {
    const f1 = ensure_function(f)
    return (...a: any[]) => f1(...a)
}

class SymPoints extends Group {
    constructor(args: SymPointsArgs = {}) {
        const { children: children0, fx, fy, size = D.point, shape: shape0, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr0 } = THEME(args, 'SymPoints')
        const [ spec, attr ] = spec_split(attr0)
        const fsize = ensure_function(size)
        const fshap = ensure_shapefunc(shape0 ?? new Dot(attr))
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute point values
        const [tvals1, xvals1, yvals1] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // make points
        const points = zip(tvals1, xvals1, yvals1).filter(
            ([t, x, y]: number[]) => (x != null) && (y != null)
        )

        // make children
        const children = enumerate(points).map(([i, [t, x, y]]) => {
            const sh = fshap(x, y, t, i)
            const sz = sh.args.rad ?? fsize(x, y, t, i)
            return sh.clone({ pos: [x, y], rad: sz })
        })

        // compute coords
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to element
        super({ children, coord, ...spec })
        this.args = args
    }
}

class SymLine extends Line {
    constructor(args: SymLineArgs = {}) {
        const { children: children0, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr } = THEME(args, 'SymLine')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute path values
        const [ tvals1, xvals1, yvals1 ] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = zip(xvals1, yvals1).filter(
            ([ x, y ]: number[]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Line
        super({ children, coord, ...attr })
        this.args = args
    }
}

class SymSpline extends Spline {
    constructor(args: SymSplineArgs = {}) {
        const { children: children0, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, curve, ...attr } = THEME(args, 'SymSpline')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute path values
        const [ tvals1, xvals1, yvals1 ] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = zip(xvals1, yvals1).filter(
            ([ x, y ]: number[]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Spline
        super({ children, coord, curve, ...attr })
        this.args = args
    }
}

class SymShape extends Shape {
    constructor(args: SymShapeArgs = {}) {
        const { children: children0, fx, fy, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, coord: coord0, ...attr } = THEME(args, 'SymShape')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute point values
        const [tvals1, xvals1, yvals1] = sympath({
            fx, fy, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = zip(xvals1, yvals1).filter(
            ([x, y]: number[]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Shape
        super({ children, coord, ...attr })
        this.args = args
    }
}

class SymFill extends Shape {
    constructor(args: SymFillArgs = {}) {
        const { children: children0, fx1, fy1, fx2, fy2, xlim: xlim0, ylim: ylim0, tlim, xvals, yvals, tvals, N, stroke = 'none', fill = '#f0f0f0', coord: coord0, ...attr } = THEME(args, 'SymFill')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)

        // compute point values
        const [tvals1, xvals1, yvals1] = sympath({
            fx: fx1, fy: fy1, xlim, ylim, tlim, xvals, yvals, tvals, N
        })
        const [tvals2, xvals2, yvals2] = sympath({
            fx: fx2, fy: fy2, xlim, ylim, tlim, xvals, yvals, tvals, N
        })

        // get valid point pairs
        const children = [...zip(xvals1, yvals1), ...zip(xvals2, yvals2).reverse()].filter(
            ([x, y]: number[]) => (x != null) && (y != null)
        )

        // compute real limits
        const coord = coord0 ?? detect_coords(xvals1, yvals1, xlim, ylim)

        // pass to Shape
        super({ children, stroke, fill, coord, ...attr })
        this.args = args
    }
}

function default_arrow(direc: number | Point): Box {
    const theta = is_scalar(direc) ? direc : vector_angle(direc)
    const arrow = new Arrow({ pos: [1, 0.5], direc: 0, tail: 1 })
    return new Box({ children: arrow, spin: theta })
}

class SymField extends SymPoints {
    constructor(args: SymFieldArgs = {}) {
        const { children: children0, func, xlim: xlim0, ylim: ylim0, N = 10, size: size0, coord: coord0, ...attr } = THEME(args, 'SymField')
        const { xlim, ylim } = resolve_limits(xlim0, ylim0, coord0 as Rect)
        const shape = ensure_singleton(children0) ?? default_arrow
        const size = size0 ?? 0.25 / N

        // check for function
        if (func == null) throw new Error('`func` must be provided')

        // create points and shape function
        const points = (xlim != null && ylim != null) ? lingrid(xlim, ylim, N) : []
        const fshap = (x: number, y: number, t: number, i: number) => shape(func(x, y))

        // compute real limits
        const [ xvals, yvals ] = points.length > 0 ? zip(...points) as [number[], number[]] : [ [], [] ]
        const coord = coord0 ?? detect_coords(xvals, yvals, xlim, ylim)

        // pass to SymPoints
        super({ children: fshap, xvals, yvals, size, coord, ...attr })
        this.args = args
    }
}

export { SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField }
export type { SymArgsBase, SymArgs, SymPointsArgs, SymLineArgs, SymSplineArgs, SymShapeArgs, SymFillArgs, SymFieldArgs }
