// network elements

import { THEME } from '../lib/theme'
import { sub_point, abs, mul_point, check_singleton, is_string, rect_center, join_limits, side_direc } from '../lib/utils'

import { Context, Element, Group, prefix_split, ensure_children } from './core'
import type { ElementArgs, GroupArgs } from './core'
import { Frame } from './layout'
import { Arrow } from './geometry'
import { Text } from './text'

import type { AlignValue, Limit, Point, Side } from '../lib/types'

//
// cardinal direction utils
//

function get_side(p1: Point, p2: Point): Side {
    const [ dx, dy ] = sub_point(p2, p1)
    const [ ax, ay ] = [ abs(dx), abs(dy) ]
    const direc = (dy <= -ax) ? 't' :
                  (dy >=  ax) ? 'b' :
                  (dx <= -ay) ? 'l' :
                  (dx >=  ay) ? 'r' :
                  undefined // should never happen
    return direc as Side
}

//
// node class
//

interface NodeArgs extends GroupArgs {
    id?: string
    yrad?: number
    rounded?: number
    padding?: number
    wrap?: number
    justify?: AlignValue
}

class Node extends Frame {
    id: string | undefined

    constructor(args: NodeArgs = {}) {
        const { children: children0, id, yrad = 0.1, rounded = 0.05, padding = 0.1, wrap, justify = 'center', ...attr } = THEME(args, 'Node')
        const [ text_attr, frame_attr ] = prefix_split([ 'text' ], attr)
        const child = check_singleton(children0)

        // check for single string child and make text element
        const inner = is_string(child) ? new Text({ children: [ child ], wrap, justify, ...text_attr }) : child

        // pass to Frame
        super({ children: [ inner ], yrad, rounded, padding, ...frame_attr })
        this.args = args
    }
}

//
// edge class
//

interface EdgeArgs extends ElementArgs {
    start?: Node | string
    end?: Node | string
    start_dir?: Side
    end_dir?: Side
    points?: Point[]
}

class Edge extends Element {
    start: Node | string
    end: Node | string
    start_dir?: Side
    end_dir?: Side
    points: Point[]

    constructor(args: EdgeArgs = {}) {
        const { start, end, start_dir, end_dir, points = [], curve = 2, ...attr } = THEME(args, 'Edge')

        // check for nodes
        if (start == null || end == null) throw new Error('Both `start` or `end` must be provided')

        // pass to Element
        super({ tag: 'g', unary: false, curve, ...attr })
        this.args = args

        // additional props
        this.start = start
        this.end = end
        this.start_dir = start_dir
        this.end_dir = end_dir
        this.points = points
    }

    svg(ctx: Context): string {
        // check for nodes
        if (is_string(this.start) || is_string(this.end)) throw new Error('Trying to render edge with node IDs')

        // get core attributes
        const attr = super.props(ctx)

        // get mapped node rects
        const start_rect = this.start.rect(ctx)
        const end_rect = this.end.rect(ctx)

        // get mapped node centers
        const start_center = rect_center(start_rect)
        const end_center = rect_center(end_rect)
        const pstart_center = ctx.mapPoint(start_center)
        const pend_center = ctx.mapPoint(end_center)

        // get emanation directions
        const start_direc = this.start_dir ?? get_side(pstart_center, pend_center)
        const end_direc = this.end_dir ?? get_side(pend_center, pstart_center)

        // get anchor points and tangent vectors
        const start = this.start.anchor(ctx, start_direc)
        const end = this.end.anchor(ctx, end_direc)
        const start_dir = side_direc(start_direc)
        const end_dir = mul_point(side_direc(end_direc), -1)

        const path = new Arrow({ points: [ start, ...this.points, end ], start_dir: start_dir, end_dir: end_dir, coord: ctx.coord, ...attr })
        return path.svg(ctx)
    }
}

//
// network class
//

interface NetworkArgs extends GroupArgs {
    xlim?: Limit
    ylim?: Limit
}

class Network extends Group {
    constructor(args: NetworkArgs = {}) {
        const { children: children0, xlim, ylim, coord: coord0, ...attr0 } = THEME(args, 'Network')
        const [ node_attr, edge_attr, attr ] = prefix_split([ 'node', 'edge' ], attr0)
        const coord = coord0 ?? join_limits({ h: xlim, v: ylim })
        const children = ensure_children(children0)

        // process nodes and make label map
        const nodes = children.filter((c: Element) => c.args.id != null).map((n: Element) => n.clone({ ...node_attr, ...n.args }))
        const nmap = new Map(nodes.map((n: Element) => [ n.args.id, n ]))

        // process children in original order
        const items = children.map((c: any) => {
            if (c instanceof Edge) {
                // create arrow path from edge
                const n1 = nmap.get(c.args.start)
                const n2 = nmap.get(c.args.end)
                return c.clone({ ...edge_attr, ...c.args, start: n1, end: n2, coord })
            } else if (c instanceof Node) {
                // return the already processed node from the map
                return nmap.get(c.args.id)
            } else {
                // other elements pass through unchanged
                return c
            }
        })

        // pass to Group
        super({ children: items, coord, ...attr })
        this.args = args
    }
}

//
// exports
//

export { Node, Edge, Network }
export type { NodeArgs, EdgeArgs, NetworkArgs }
