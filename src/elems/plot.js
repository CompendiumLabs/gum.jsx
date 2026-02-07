// plot elements

import { Group, prefix_split, prefix_join, spec_split, is_element } from './core.js'
import { Box, Frame, Attach, Spacer, HStack, VStack, Anchor } from './layout.js'
import { RoundedRect, UnitLine, HLine } from './geometry.js'
import { Span } from './text.js'
import { CONSTANTS as C, DEFAULTS as D, THEME } from '../defaults.js'
import { linspace, invert_direc, join_limits, ensure_array, ensure_vector, is_scalar, is_string, is_object, check_singleton, rounder, enumerate, aspect_invariant, rect_aspect, merge_rects, expand_limits, flip_rect, resolve_limits } from '../lib/utils.js'

//
// bar components
//

class Bar extends RoundedRect {
    constructor(args = {}) {
        const { direc = 'v', fill = C.blue, stroke = C.none, rounded: rounded0 = true, ...attr } = THEME(args, 'Bar')
        const rounded = rounded0 == true ? (direc == 'v' ? [ 0.1, 0.1, 0, 0 ] : [ 0, 0.1, 0.1, 0 ]) : rounded0
        super({ fill, stroke, rounded, ...attr })
        this.args = args
    }
}

class VBar extends Bar {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VBar')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HBar extends Bar {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HBar')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class Bars extends Group {
    constructor(args = {}) {
        const { children: children0, direc = 'v', width = 0.75, zero = 0, ...attr0 } = THEME(args, 'Bars')
        const [ spec, attr ] = spec_split(attr0)
        const bars = ensure_array(children0)
        const idirec = invert_direc(direc)

        // make rects from sizes
        const children = bars.map((child, i) => {
            if (is_scalar(child)) child = new Bar({ direc, size: child, ...attr })
            const { loc = i, size } = child.attr
            const rect = join_limits({
                [direc]: [ zero, size ],
                [idirec]: [ loc - width / 2, loc + width / 2 ],
            })
            return child.clone({ direc, rect, ...attr })
        })

        // pass to Group
        super({ children, coord: 'auto', ...spec })
        this.args = args
    }
}

class VBars extends Bars {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VBars')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HBars extends Bars {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HBars')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

//
// plotting elements
//

function ensure_ticklabel(label, args = {}) {
    const { prec = D.prec, ...attr } = args
    if (is_element(label)) return label.clone(attr)
    const [ loc, str ] = is_scalar(label) ? [ label, label ] : label
    return new Span({ children: rounder(str, prec), loc, ...attr })
}

class Scale extends Group {
    constructor(args = {}) {
        const { children: children0, locs, direc = 'h', span = D.lim, ...attr0 } = THEME(args, 'Scale')
        const [ spec, attr ] = spec_split(attr0)
        const tick_dir = invert_direc(direc)

        // make tick lines
        const children = locs.map(t => {
            const rect = join_limits({ [direc]: [t, t], [tick_dir]: span })
            return new UnitLine({ direc: tick_dir, rect, expand: true, ...attr })
        })

        // set coordinate system
        super({ children, ...spec })
        this.args = args
    }
}

class VScale extends Scale {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VScale')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class HScale extends Scale {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HScale')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

// label elements must have an aspect to properly size them
class Labels extends Group {
    constructor(args = {}) {
        const { children: children0, direc = 'h', justify: justify0 = null, loc: subloc = null, prec = D.prec, ...attr0 } = THEME(args, 'Labels')
        const items = ensure_array(children0)
        const [ spec, attr ] = spec_split(attr0)
        const justify = justify0 ?? (direc == 'h' ? 'center' : 'right')

        // place tick boxes using expanded lines
        const children = items.map(c0 => {
            const c = ensure_ticklabel(c0, attr, prec)
            const { loc } = c.attr
            const rect = join_limits({ [direc]: [ loc, loc ] })
            return new Anchor({ children: c, rect, expand: true, aspect: 1, justify, loc: subloc })
        })

        // pass to Group
        super({ children, ...spec })
        this.args = args
    }
}

class HLabels extends Labels {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HLabels')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VLabels extends Labels {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VLabels')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

function get_tick_lim(lim) {
    if (lim == 'inner') {
        return [0.5, 1]
    } else if (lim == 'outer') {
        return [0, 0.5]
    } else if (lim == 'both') {
        return [0, 1]
    } else if (lim == 'none') {
        return [0, 0]
    } else {
        return lim
    }
}

// this is designed to be plotted directly
// this takes a nested coord approach, not entirely sure about that
class Axis extends Group {
    constructor(args = {}) {
        const { children, lim = D.lim, direc, ticks: ticks0, tick_side = 'inner', label_side = 'outer', label_size = 1.5, label_offset = 0.75, label_justify: label_justify0 = null, label_loc = null, discrete = false, prec = D.prec, debug, ...attr0 } = THEME(args, 'Axis')
        const [ label_attr, tick_attr, line_attr, attr ] = prefix_split([ 'label', 'tick', 'line' ], attr0)
        const tick_lim = get_tick_lim(tick_side)
        const [ tick_lo, tick_hi ] = tick_lim

        // get tick and label limits
        const label_justify = label_justify0 ?? ((direc == 'v') ? (label_side == 'outer' ? 'right' : 'left') : 'center')
        const label_base = (label_side == 'inner') ? (tick_hi + label_offset) : (tick_lo - label_offset - label_size)
        const label_lim = [ label_base, label_base + label_size ]

        // set up one-sides coordinate system
        const idirec = invert_direc(direc)
        const coord = join_limits({ [direc]: lim })
        const scale_rect = join_limits({ [idirec]: tick_lim })
        const label_rect = join_limits({ [idirec]: label_lim })

        // extract tick information
        const ticks = ticks0 != null ? (is_scalar(ticks0) ? linspace(...lim, ticks0) : ticks0) : []
        const labels = children ?? ticks.map(t => ensure_ticklabel(t, label_attr, prec))
        const locs = labels.map(c => c.attr.loc)

        // accumulate children
        const cline = new UnitLine({ direc, lim, coord, ...line_attr })
        const scale = new Scale({ locs, direc, rect: scale_rect, coord, debug, ...tick_attr })
        const label = new Labels({ children: labels, direc, justify: label_justify, loc: label_loc, rect: label_rect, coord, debug })

        // pass to Group
        super({ children: [ cline, scale, label ], debug, ...attr })
        this.args = args

        // additional props
        this.locs = locs
    }
}

class HAxis extends Axis {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HAxis')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VAxis extends Axis {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VAxis')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class BoxLabel extends Attach {
    constructor(args = {}) {
        const { children: children0, size, offset, side, ...attr0 } = args
        const text = check_singleton(children0)
        const [ spec, attr ] = spec_split(attr0)
        const label0 = is_element(text) ? text : new Span({ children: text, ...attr })
        const label = (side == 'left' || side == 'right') ? label0.clone({ rotate: -90 }) : label0
        super({ children: label, side, size, offset, ...spec })
        this.args = args
    }
}

class Mesh extends Scale {
    constructor(args = {}) {
        const { children: children0, locs: locs0 = 10, direc = 'h', lim = D.lim, span = D.lim, ...attr } = THEME(args, 'Mesh')
        const locs = is_scalar(locs0) ? linspace(...lim, locs0) : locs0
        const coord = join_limits({ [direc]: lim })
        super({ locs, direc, coord, span, ...attr })
        this.args = args
    }
}

class HMesh extends Mesh {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'HMesh')
        super({ direc: 'h', ...attr })
        this.args = args
    }
}

class VMesh extends Mesh {
    constructor(args = {}) {
        const { ...attr } = THEME(args, 'VMesh')
        super({ direc: 'v', ...attr })
        this.args = args
    }
}

class Mesh2D extends Group {
    constructor(args = {}) {
        let { children: children0, locs = 10, xlocs = null, ylocs = null, direc = 'h', xlim = D.lim, ylim = D.lim, xspan = null, yspan = null, ...attr } = THEME(args, 'Mesh2D')

        // set default values
        xlocs ??= locs
        ylocs ??= locs
        xspan ??= xlim
        yspan ??= ylim

        // convert locs to arrays
        xlocs = is_scalar(xlocs) ? linspace(...xlim, xlocs) : xlocs
        ylocs = is_scalar(ylocs) ? linspace(...ylim, ylocs) : ylocs

        // create meshes
        const hmesh = new HMesh({ locs: xlocs, span: yspan, lim: xlim, ...attr })
        const vmesh = new VMesh({ locs: ylocs, span: xspan, lim: ylim, ...attr })

        // pass to Group
        super({ children: [ hmesh, vmesh ], ...attr })
        this.args = args
    }
}

function ensure_legendbadge(c, attr = {}) {
    if (is_element(c)) return c
    if (is_string(c)) {
        attr = { stroke: c, ...attr }
    } else if (is_object(c)) {
        attr = { ...c, ...attr }
    } else {
        throw new Error(`Unrecognized legend badge specification: ${c}`)
    }
    return new HLine({ aspect: 1, ...attr })
}

function ensure_legendlabel(label, attr = {}) {
    if (is_element(label)) return label
    if (is_string(label)) {
        return new Span({ children: label, ...attr })
    } else {
        throw new Error(`Unrecognized legend label specification: ${label}`)
    }
}

// TODO: have a .badge/.label api for plottable elements
class Legend extends Frame {
    constructor(args = {}) {
        const { children: children0, lines, vspacing = 0.1, hspacing = 0.25, rounded = 0.025, padding = 0.05, fill = C.white, justify = 'left', debug, ...attr0 } = THEME(args, 'Legend')
        const children = ensure_array(children0)
        const [ badge_attr, text_attr, attr ] = prefix_split([ 'badge', 'text' ], attr0)

        // construct legend badges and labels
        const badges = children.map(b => ensure_legendbadge(b, badge_attr))

        // construct legend grid
        const rows = badges.map(b => {
            const { label } = b.attr
            const { aspect } = b.spec
            const b1 = b.clone({ aspect: aspect ?? 1, label: null })
            const spacer = new Spacer({ aspect: hspacing })
            const text = ensure_legendlabel(label, text_attr)
            return new HStack({ children: [ b1, spacer, text ], debug })
        })
        const vs = new VStack({ children: rows, spacing: vspacing, justify, even: true })

        // pass to Frame
        super({ children: vs, rounded, padding, fill, stroke, ...attr })
        this.args = args
    }
}

// find minimal containing limits
function outer_limits(children, { xlim, ylim, padding = 0 } = {}) {
    if (children.length == 0) return null

    // pull in child coordinate system
    const coord0 = merge_rects(children.map(c => c.spec.coord))
    const { xlim: xlim0, ylim: ylim0 } = resolve_limits(xlim, ylim, coord0)

    // expand with padding
    const [ xpad, ypad ] = ensure_vector(padding, 2)
    xlim = expand_limits(xlim0 ?? D.lim, xpad)
    ylim = expand_limits(ylim0 ?? D.lim, ypad)

    // return coordinate system
    return join_limits({ h: xlim, v: ylim })
}

// plottable things should accept xlim/ylim and may report coords on their own
class Graph extends Group {
    constructor(args = {}) {
        let { children: children0, xlim, ylim, coord = 'auto', aspect = null, padding = 0, flip = true, ...attr } = THEME(args, 'Graph')
        const elems = ensure_array(children0)

        // get default outer limits
        coord = coord == 'auto' ? outer_limits(elems, { xlim, ylim, padding }) : coord
        aspect = aspect == 'auto' ? rect_aspect(coord) : aspect

        // flip coordinate system if requested
        if (flip) coord = flip_rect(coord, true)

        // map coordinate system to all elements
        const children = elems.map(e => {
            if (e.spec.rect != null) {
                return new Group({ children: e, coord })
            } else {
                return e.clone({ coord })
            }
        })

        // pass to Group
        super({ children, aspect, ...attr })
        this.args = args
    }
}

class Plot extends Box {
    constructor(args = {}) {
        let {
            children: children0, xlim, ylim, axis = true, xaxis = null, yaxis = null, xticks = 5, yticks = 5, xanchor, yanchor, grid = null, xgrid = null, ygrid = null, xlabel = null, ylabel = null, title = null, tick_size = 0.015, label_size = 0.05, label_offset = [ 0.11, 0.18 ], title_size = 0.075, title_offset = 0.05, xlabel_size, ylabel_size, xlabel_offset, ylabel_offset, xtick_size, ytick_size, padding = 0, margin = 0, aspect: aspect0, clip = false, debug = false, ...attr0
        } = THEME(args, 'Plot')
        const elems = ensure_array(children0, false)

        // determine coordinate system and aspect
        const coord = outer_limits(elems, { xlim, ylim, padding })
        const [ xmin, ymin, xmax, ymax ] = coord
        xlim = [ xmin, xmax ]
        ylim = [ ymin, ymax ]

        // determine aspect and tick/size/offset
        const aspect = aspect0 == 'auto' ? rect_aspect(coord) : aspect0
        const [ xtick_size0, ytick_size0 ] = aspect_invariant(tick_size, aspect)
        const [ xlabel_size0, ylabel_size0 ] = aspect_invariant(label_size, aspect)
        const [ xlabel_offset0, ylabel_offset0 ] = aspect_invariant(label_offset, aspect)

        // default anchor points
        xanchor ??= ymin
        yanchor ??= xmin

        // default boolean values
        xaxis ??= axis
        yaxis ??= axis
        xgrid ??= grid
        ygrid ??= grid

        // set aspect aware default values
        xtick_size ??= xtick_size0
        ytick_size ??= ytick_size0
        xlabel_size ??= xlabel_size0
        ylabel_size ??= ylabel_size0
        xlabel_offset ??= xlabel_offset0
        ylabel_offset ??= ylabel_offset0

        // some advanced piping
        let [
            xaxis_attr, yaxis_attr, axis_attr, xtick_label_attr, xtick_attr, ytick_label_attr, ytick_attr, tick_label_attr, tick_attr, xgrid_attr, ygrid_attr, grid_attr, xlabel_attr, ylabel_attr, label_attr, title_attr, attr
        ] = prefix_split([
            'xaxis', 'yaxis', 'axis', 'xtick_label', 'xtick', 'ytick_label', 'ytick', 'tick_label', 'tick', 'xgrid', 'ygrid', 'grid', 'xlabel', 'ylabel', 'label', 'title'
        ], attr0)
        xtick_attr = { ...xtick_attr, ...tick_attr }
        ytick_attr = { ...ytick_attr, ...tick_attr }
        xtick_label_attr = { ...xtick_label_attr, ...tick_label_attr }
        ytick_label_attr = { ...ytick_label_attr, ...tick_label_attr }
        xaxis_attr = { ...axis_attr, ...xaxis_attr, ...prefix_join('tick', xtick_attr), ...prefix_join('label', xtick_label_attr) }
        yaxis_attr = { ...axis_attr, ...yaxis_attr, ...prefix_join('tick', ytick_attr), ...prefix_join('label', ytick_label_attr) }
        xgrid_attr = { ...grid_attr, ...xgrid_attr }
        ygrid_attr = { ...grid_attr, ...ygrid_attr }
        xlabel_attr = { size: xlabel_size, offset: xlabel_offset, ...label_attr, ...xlabel_attr }
        ylabel_attr = { size: ylabel_size, offset: ylabel_offset, ...label_attr, ...ylabel_attr }
        title_attr = { size: title_size, offset: title_offset, ...title_attr }

        // collect axis elements
        const bg_elems = []
        const fg_elems = []

        // default xaxis generation
        if (xaxis === true) {
            const xtick_size1 = xtick_size * (ymax - ymin)
            const xaxis_yrect = [ xanchor - xtick_size1, xanchor + xtick_size1 ]
            xaxis = new HAxis({ ticks: xticks, lim: xlim, xrect: xlim, yrect: xaxis_yrect, ...xaxis_attr })
            fg_elems.push(xaxis)
        } else if (xaxis === false) {
            xaxis = null
        }

        // default yaxis generation
        if (yaxis === true) {
            const ytick_size1 = ytick_size * (xmax - xmin)
            const yaxis_xrect = [ yanchor - ytick_size1, yanchor + ytick_size1 ]
            yaxis = new VAxis({ ticks: yticks, lim: ylim, xrect: yaxis_xrect, yrect: ylim, ...yaxis_attr })
            fg_elems.push(yaxis)
        } else if (yaxis === false) {
            yaxis = null
        }

        // automatic xgrid generation
        if (xgrid != null && xgrid !== false) {
            const locs = (xgrid === true && xaxis != null) ? xaxis.locs : xgrid
            xgrid = new HMesh({ locs, lim: xlim, rect: coord, ...xgrid_attr })
            bg_elems.unshift(xgrid)
        } else {
            xgrid = null
        }

        // automatic ygrid generation
        if (ygrid != null && ygrid !== false) {
            const locs = (ygrid === true && yaxis != null) ? yaxis.locs : ygrid
            ygrid = new VMesh({ locs, lim: ylim, rect: coord, ...ygrid_attr })
            bg_elems.unshift(ygrid)
        } else {
            ygrid = null
        }

        // create graph from core elements
        const bg_graph = new Graph({ children: bg_elems, coord, aspect: null })
        const fg_graph = new Graph({ children: fg_elems, coord, aspect: null })
        const el_graph = new Graph({ children: elems, coord, aspect: null, clip })
        const children = [ bg_graph, el_graph, fg_graph ]

        // optional xaxis label
        if (xlabel != null) {
            xlabel = new BoxLabel({ children: xlabel, side: 'bottom', debug, ...xlabel_attr })
            children.push(xlabel)
        }

        // optional yaxis label
        if (ylabel != null) {
            const ylabel_text = is_element(ylabel) ? ylabel : new Span({ children: ylabel, ...ylabel_attr, rotate: -90 })
            ylabel = new BoxLabel({ children: ylabel_text, side: 'left', debug, ...ylabel_attr })
            children.push(ylabel)
        }

        // optional plot title
        if (title != null) {
            title = new BoxLabel({ children: title, side: 'top', debug, ...title_attr })
            children.push(title)
        }

        // pass to Box
        const inner = new Group({ children, aspect })
        super({ children: inner, margin, ...attr })
        this.args = args
    }
}

class BarPlot extends Plot {
    constructor(args = {}) {
        const { children: children0, direc = 'v', aspect = 2, xtick_side = 'outer', ...attr0 } = THEME(args, 'BarPlot')
        const [ bar_attr, attr ] = prefix_split([ 'bar' ], attr0)
        const children = ensure_array(children0)

        // handle data array case
        const sibs = children.map(child => {
            if (is_element(child)) return child
            const [ label, size ] = is_scalar(child) ? [ child, child ] : child
            return new Bar({ label, size, ...bar_attr })
        })

        // separate out bars and not-bars
        const yes_bars = sibs.filter(child => child instanceof Bar)
        const not_bars = sibs.filter(child => !(child instanceof Bar))

        // extract labels and create bars
        const labs = yes_bars.map(child => child.attr.label)
        const bars = new Bars({ children: yes_bars, direc, ...bar_attr })

        // determine axis ticks
        const tickdir = direc === 'v' ? 'x' : 'y'
        const [ tname, ticks ] = [ `${tickdir}ticks`, enumerate(labs) ]
        const [ lname, limit ] = [ `${tickdir}lim`, [ -0.75, yes_bars.length - 0.25 ] ]

        // pass on to Plot
        super({ children: [ bars, ...not_bars ], [tname]: ticks, [lname]: limit, aspect, xtick_side, ...attr })
        this.args = args
    }
}

export { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, HLabels, VLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Legend, Graph, Plot, BarPlot }
