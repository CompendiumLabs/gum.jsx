// defaults

const DEFAULTS = {
    // spec
    spec: {
        loc: 0.5,
        lim: [0, 1],
        pos: [0.5, 0.5],
        rad: 0.5,
        rect: [0, 0, 1, 1],
        coord: [0, 0, 1, 1],
    },

    debug: {
        stroke_dasharray: 3,
        opacity: 0.5,
    },

    // svg
    svg: {
        ns: 'http://www.w3.org/2000/svg',
        size: 500,
        prec: 2,
    },

    // bool
    bool: {
        rounded: 0.05,
        margin: 0.1,
        padding: 0.1,
        spacing: 0.1,
    },

    // fonts
    font: {
        family: 'IBM Plex Sans',
        weight: 100,
        calc_size: 16,
    },

    point: {
        size: 0.025,
    },

    sym: {
        N: 100,
    },

    text: {
        color: 'black',
        wrap: 20,
        spacing: 0.2,
        padding: 0.1,
        voffset: -0.12,
    },

    node: {
        rad: 0.05,
        rounded: 0.05,
        padding: 0.1,
        wrap: 10,
    },

    // plot defaults
    plot: {
        num_ticks: 5,
        tick_size: 0.015,
        tick_label_size: 1.5,
        tick_label_offset: 0.5,
        label_size: 0.05,
        label_offset: [ 0.11, 0.18 ],
        title_size: 0.1,
        title_offset: 0.05,
    },

    // titleframe size
    titleframe: {
        title_size: 0.05,
        title_rounded: 0.1,
    },

    slide: {
        wrap: 25,
        border: 1,
        rounded: 0.01,
        border_stroke: '#bbb',
        title_size: 0.05,
        font_weight: 'bold',
    },
}

export { DEFAULTS }
