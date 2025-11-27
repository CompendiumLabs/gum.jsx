// defaults

import { map_object } from './utils.js'

//
// constants
//

const CONSTANTS = {
    svgns: 'http://www.w3.org/2000/svg',
    htmlns: 'http://www.w3.org/1999/xhtml',
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

const C = CONSTANTS

//
// default values
//

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
    size: 500,
    calc_size: 16,
}

const DEBUG = {
    stroke_dasharray: 3,
    opacity: 0.5,
}

//
// base layer
//

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
    const BOOLEANS_ELEMENT = BOOLEANS[elem] ?? {}

    // get theme defaults
    const DEFAULTS_THEME = theme ? THEMES[theme] : {}
    const DEFAULTS_ELEMENT = DEFAULTS_THEME[elem] ?? {}

    // map in booleans from args
    const BOOLEANS_MAPPED = map_object(args, (k, v) => (v === true) && (k in BOOLEANS_ELEMENT) ? BOOLEANS_ELEMENT[k] : v)

    // return the whole shazam
    return { ...DEFAULTS_ELEMENT, ...BOOLEANS_MAPPED }
}

//
// exports
//

export { CONSTANTS, DEFAULTS, DEBUG, THEME, getTheme, setTheme }
