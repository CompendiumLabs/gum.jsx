// network elements

import { THEME } from '../lib/theme.js'
import { sub, abs, mul, zip, check_singleton, is_string, unit_direc, vector_angle, cardinal_direc, rect_center, join_limits } from '../lib/utils.js'

import { Context, Element, Group, prefix_split } from './core.js'
import type { ElementArgs, GroupArgs } from './core.js'
import { Frame } from './layout.js'
import { ArrowHead, Spline } from './geometry.js'
import { Text } from './text.js'

import type { Point, Rect } from '../lib/types.js'

//
// args interfaces
//

interface ArrowSplineArgs extends GroupArgs {
    from?: Point
    to?: Point
    from_dir?: Point | string
    to_dir?: Point | string
    arrow?: boolean
    from_arrow?: boolean
    to_arrow?: boolean
    arrow_size?: number
    arrow_aspect?: number
    curve?: number
    stroke_width?: number
    stroke_linecap?: string
    fill?: string
    coord?: Rect
}

interface NodeArgs extends ElementArgs {
    id?: string
    yrad?: number
    rounded?: number
    padding?: number
    wrap?: number
    justify?: string
}

interface EdgeArgs extends ElementArgs {
    from?: any
    to?: any
    from_dir?: string
    to_dir?: string
}

interface NetworkArgs extends GroupArgs {
    xlim?: [number, number]
    ylim?: [number, number]
}

//
// networks
//

function get_direction(p1: Point, p2: Point): string | null {
    const [ dx, dy ] = sub(p2, p1)
    const [ ax, ay ] = [ abs(dx), abs(dy) ]

    return (dy <= -ax) ? 'n' :
           (dy >=  ax) ? 's' :
           (dx >=  ay) ? 'e' :
           (dx <= -ay) ? 'w' :
           null
}

class ArrowSpline extends Group {
    constructor(args: ArrowSplineArgs = {}) {
        let { children: children0, from, to, from_dir, to_dir, arrow, from_arrow, to_arrow, arrow_size = 0.03, arrow_aspect = 1, curve = 2, stroke_width, stroke_linecap, fill, coord, ...attr0 } = THEME(args, 'ArrowSpline')
        let [ spline_attr, arrow_attr, from_attr, to_attr, attr ] = prefix_split(
            [ 'spline', 'arrow', 'from', 'to' ], attr0
        )
        from_arrow = arrow ?? from_arrow ?? false
        to_arrow   = arrow ?? to_arrow   ?? true

        // accumulate arguments
        const stroke_attr = { stroke_linecap, stroke_width }
        spline_attr = { ...stroke_attr, ...spline_attr }
        arrow_attr = { aspect: arrow_aspect, ...arrow_attr }
        from_attr = { fill, ...stroke_attr, ...arrow_attr, ...from_attr }
        to_attr   = { fill, ...stroke_attr, ...arrow_attr, ...to_attr   }

        // set default directions (gets normalized later)
        const direc = sub(to as Point, from as Point)
        const dir1 = unit_direc(from_dir ?? direc)
        const dir2 = unit_direc(to_dir   ?? direc)

        // get arrow offsets
        const soff = 0.5 * (stroke_width ?? 1)
        const pos1 = from_arrow ? zip(from as Point, mul(dir1,  soff)) : from
        const pos2 = to_arrow   ? zip(to as Point,   mul(dir2, -soff)) : to

        // make cubic spline shaft
        const spline = new Spline({ children: [ pos1, pos2 ], dir1, dir2, curve, coord, ...spline_attr })
        const children: Element[] = [ spline ]

        // make start arrowhead
        if (from_arrow) {
            const ang1 = vector_angle(dir1)
            const head_beg = new ArrowHead({ direc: 180 - ang1, pos: from as Point, rad: arrow_size, ...from_attr })
            children.push(head_beg)
        }

        // make end arrowhead
        if (to_arrow) {
            const ang2 = vector_angle(dir2)
            const head_end = new ArrowHead({ direc: -ang2, pos: to as Point, rad: arrow_size, ...to_attr })
            children.push(head_end)
        }

        // pass to Group
        super({ children, coord, ...attr })
        this.args = args
    }
}

class Node extends Frame {
    id: string | undefined

    constructor(args: NodeArgs = {}) {
        const { children: children0, id, yrad = 0.1, rounded = 0.05, padding = 0.1, wrap, justify = 'center', ...attr } = THEME(args, 'Node')
        const [ text_attr, frame_attr ] = prefix_split([ 'text' ], attr)
        const child = check_singleton(children0)

        // check for single string child and make text element
        const children = is_string(child) ? new Text({ children: child, wrap, justify, ...text_attr }) : child

        // pass to Frame
        super({ children, yrad, rounded, padding, ...frame_attr })
        this.args = args

        // additional props
        this.id = id
    }
}

function anchor_point(rect: Rect, direc: string): Point | null {
    const [ xmin, ymin, xmax, ymax] = rect
    const [ xmid, ymid ] = rect_center(rect)
    return (direc == 'n') ? [ xmid, ymin ] :
           (direc == 's') ? [ xmid, ymax ] :
           (direc == 'e') ? [ xmax, ymid ] :
           (direc == 'w') ? [ xmin, ymid ] :
           null
}

class Edge extends Element {
    from: any
    to: any
    from_dir: string | undefined
    to_dir: string | undefined

    constructor(args: EdgeArgs = {}) {
        const { from, to, from_dir, to_dir, ...attr } = THEME(args, 'Edge')

        // pass to Element
        super({ tag: 'g', unary: false, ...attr })
        this.args = args

        // additional props
        this.from = from
        this.to = to
        this.from_dir = from_dir
        this.to_dir = to_dir
    }

    svg(ctx: Context): string {
        // get core attributes
        const attr = super.props(ctx)

        // get mapped node rects
        const rect_from = this.from.rect(ctx)
        const rect_to = this.to.rect(ctx)

        // get emanation directions
        const center_from = rect_center(rect_from)
        const center_to = rect_center(rect_to)
        const pcenter_from = ctx.mapPoint(center_from)
        const pcenter_to = ctx.mapPoint(center_to)
        const direc_from = this.from_dir ?? get_direction(pcenter_from, pcenter_to)
        const direc_to = this.to_dir ?? get_direction(pcenter_to, pcenter_from)

        // get anchor points and tangent vectors
        const from = anchor_point(rect_from, direc_from!)
        const to = anchor_point(rect_to, direc_to!)
        const from_dir = cardinal_direc(direc_from!)
        const to_dir = mul(cardinal_direc(direc_to!), -1)

        const arrowpath = new ArrowSpline({ from, to, from_dir, to_dir, coord: ctx.coord, ...attr })
        return arrowpath.svg(ctx)
    }
}

class Network extends Group {
    constructor(args: NetworkArgs = {}) {
        const { children: children0, xlim, ylim, coord: coord0, ...attr0 } = THEME(args, 'Network')
        const [ node_attr, edge_attr, attr ] = prefix_split([ 'node', 'edge' ], attr0)
        const coord = coord0 ?? join_limits({ h: xlim, v: ylim })

        // process nodes and make label map
        const nodes = children0.filter((c: any) => c instanceof Node).map((n: any) => n.clone({ ...node_attr, ...n.args }))
        const nmap = new Map(nodes.map((n: any) => [ n.id, n ]))

        // process children in original order
        const children = children0.map((c: any) => {
            if (c instanceof Edge) {
                // create arrow path from edge
                const n1 = nmap.get(c.args.from)
                const n2 = nmap.get(c.args.to)
                return c.clone({ ...edge_attr, ...c.args, from: n1, to: n2, coord })
            } else if (c instanceof Node) {
                // return the already processed node from the map
                return nmap.get(c.id)
            } else {
                // other elements pass through unchanged
                return c
            }
        })

        // pass to Group
        super({ children, coord, ...attr })
        this.args = args
    }
}

export { ArrowSpline, Node, Edge, Network }
export type { ArrowSplineArgs, NodeArgs, EdgeArgs, NetworkArgs }
