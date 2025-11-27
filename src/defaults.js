// defaults

import { map_object } from './utils.js'

//
// constants
//

const SVG_NS = 'http://www.w3.org/2000/svg'

//
// default values
//

const CONSTANTS = {
    sans: 'IBM Plex Sans',
    mono: 'IBM Plex Mono',
    normal: 250,
    bold: 350,
    black: 'black',
    white: 'white',
    gray: '#f0f0f0',
    none: 'none',
    voffset: -0.12,
}

const DEFAULTS = {
    prec: 2,
    loc: 0.5,
    lim: [0, 1],
    pos: [0.5, 0.5],
    rad: 0.5,
    rect: [0, 0, 1, 1],
    coord: [0, 0, 1, 1],
    point: 0.025,
    N: 100,
    calc_size: 16,
}

const DEBUG = {
    stroke_dasharray: 3,
    opacity: 0.5,
}

//
// base layer
//

const C = CONSTANTS
const D = DEFAULTS

const THEME_BASE = {
    Svg: {
        ns: SVG_NS,
        font_family: C.sans,
        font_weight: C.normal,
        size: 500,
        prec: D.prec,
    },

    TextSpan: {
        stroke: C.none,
        font_family: C.sans,
    },

    ElemSpan: {
        spacing: 0.25,
    },

    Text: {
        spacing: 0.1,
    },

    TextBox: {
        padding: 0.1,
    },

    TextFrame: {
        rounded: 0.05,
    },

    TextFlex: {
        spacing: 0.1,
        color: C.black,
        font_family: C.sans,
    },

    Node: {
        rad: 0.15,
        rounded: 0.05,
        padding: 0.1,
    },

    Axis: {
        label_size: 1.5,
        label_offset: 0.75,
    },

    Plot: {
        xticks: 5,
        yticks: 5,
        tick_size: 0.015,
        label_size: 0.05,
        label_offset: [ 0.11, 0.18 ],
        title_size: 0.1,
        title_offset: 0.05,
        grid_stroke: '#ddd',
    },

    TitleFrame: {
        title_size: 0.05,
        title_rounded: 0.1,
    },

    Slide: {
        wrap: 25,
        padding: 0.1,
        margin: 0.1,
        border: 1,
        rounded: 0.01,
        border_stroke: '#bbb',
        title_size: 0.05,
        title_text_font_weight: C.bold,
    },
}

const BOOLEANS = {
    Box: {
        border: 1,
        padding: 0.1,
        margin: 0.1,
        rounded: 0.05,
    },

    Stack: {
        spacing: 0.1,
    },

    Grid: {
        spacing: 0.1,
    },

    Rect: {
        rounded: 0.05,
    },

    RoundedRect: {
        rounded: 0.05,
    },

    TextSpan: {
        color: C.black,
    },

    Graph: {
        padding: 0.1,
    },

    Plot: {
        margin: 0.2,
    },
}

//
// theme management
//

const THEME_LIGHT = {
    Svg: {
        fill: C.none,
        stroke: C.black,
    },

    TextSpan: {
        color: C.black,
    },
}

const THEMES = {
    light: THEME_LIGHT,
}

// theme state
let theme = 'light'
function getTheme(key) {
    return key
}
function setTheme(key) {
    theme = key
}

// theme function
function THEME(args, elem) {

    // get base theme defaults
    const DEFAULTS_BASE = THEME_BASE[elem] ?? {}
    const BOOLEANS_BASE = BOOLEANS[elem] ?? {}

    // get theme defaults
    const DEFAULTS_THEME = theme ? THEMES[theme] : {}
    const DEFAULTS_ELEMENT = DEFAULTS_THEME[elem] ?? {}

    // map in booleans from args
    const BOOLEANS_ELEMENT = map_object(args, (k, v) => (v === true) && (k in BOOLEANS_BASE) ? BOOLEANS_BASE[k] : v)

    // return the whole shazam
    return { ...DEFAULTS_BASE, ...DEFAULTS_ELEMENT, ...BOOLEANS_ELEMENT }
}

//
// exports
//

export { CONSTANTS, DEFAULTS, DEBUG, THEME, getTheme, setTheme }
