// network elements

import { THEME } from '../lib/theme'
import { sub_point, abs, mul_point, check_singleton, is_string, cardinal_direc, rect_center, join_limits } from '../lib/utils'

import { Context, Element, Group, prefix_split, ensure_children } from './core'
import type { ElementArgs, GroupArgs } from './core'
import { Frame } from './layout'
import { Arrow } from './geometry'
import { Text } from './text'

import type { AlignValue, Cardinal, Limit, Point, Rect } from '../lib/types'

//
// cardinal direction utils
//

function get_direction(p1: Point, p2: Point): Cardinal {
    const [ dx, dy ] = sub_point(p2, p1)
    const [ ax, ay ] = [ abs(dx), abs(dy) ]
    const direc = (dy <= -ax) ? 'n' :
                  (dy >=  ax) ? 's' :
                  (dx >=  ay) ? 'e' :
                  (dx <= -ay) ? 'w' :
                  undefined // should never happen
    return direc as Cardinal
}

function anchor_point(rect: Rect, direc: Cardinal): Point {
    const [ xmin, ymin, xmax, ymax] = rect
    const [ xmid, ymid ] = rect_center(rect)
    const point = (direc == 'n') ? [ xmid, ymin ] :
                  (direc == 's') ? [ xmid, ymax ] :
                  (direc == 'e') ? [ xmax, ymid ] :
                  (direc == 'w') ? [ xmin, ymid ] :
                  undefined // should never happen
    return point as Point
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
    from?: Node | string
    to?: Node | string
    from_dir?: Cardinal
    to_dir?: Cardinal
}

class Edge extends Element {
    from: Node | string
    to: Node | string
    from_dir: Cardinal | undefined
    to_dir: Cardinal | undefined

    constructor(args: EdgeArgs = {}) {
        const { from, to, from_dir, to_dir, curve = 2, ...attr } = THEME(args, 'Edge')

        // check for nodes
        if (from == null || to == null) throw new Error('Both `from` or `to` must be provided')

        // pass to Element
        super({ tag: 'g', unary: false, curve, ...attr })
        this.args = args

        // additional props
        this.from = from
        this.to = to
        this.from_dir = from_dir
        this.to_dir = to_dir
    }

    svg(ctx: Context): string {
        // check for nodes
        if (is_string(this.from) || is_string(this.to)) throw new Error('Trying to render edge with node IDs')

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
        const from = anchor_point(rect_from, direc_from)
        const to = anchor_point(rect_to, direc_to)
        const from_dir = cardinal_direc(direc_from)
        const to_dir = mul_point(cardinal_direc(direc_to), -1)

        const path = new Arrow({ from, to, from_dir, to_dir, coord: ctx.coord, ...attr })
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
                const n1 = nmap.get(c.args.from)
                const n2 = nmap.get(c.args.to)
                return c.clone({ ...edge_attr, ...c.args, from: n1, to: n2, coord })
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
