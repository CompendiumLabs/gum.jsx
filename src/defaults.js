// defaults

const DEFAULTS = {
    // svg
    svg_ns: 'http://www.w3.org/2000/svg',
    svg_size: 500,

    // sizing
    loc: 0.5,
    pos: [0.5, 0.5],
    rad: 0.5,
    rect: [0, 0, 1, 1],
    coord: [0, 0, 1, 1],
    lim: [0, 1],
    prec: 2,
    N: 100,

    // fonts
    family_sans: 'IBM Plex Sans',
    family_mono: 'IBM Plex Mono',
    font_weight: 100,
    font_size: 12,
    calc_size: 72,

    // plot defaults
    num_ticks: 5,
    tick_size: 0.015,
    tick_label_size: 1.5,
    tick_label_offset: 0.5,
    label_size: 0.05,
    label_offset: [ 0.11, 0.18 ],
    title_size: 0.10,
    title_offset: 0.05,
}

const BOOLEAN = {
    rounded: 0.05,
    margin: 0.1,
    padding: 0.1,
    spacing: 0.1,
}

export { DEFAULTS, BOOLEAN }
