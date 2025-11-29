// defaults

import { map_object, is_array, is_string } from './utils.js'

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

    TitleFrame: {
        title_fill: C.white,
    },

    Plot: {
        grid_stroke: '#ddd',
    },
}

const THEME_DARK = {
    Svg: {
        fill: C.none,
        stroke: C.white,
    },

    Dot: {
        fill: C.white,
        stroke: C.white,
    },

    TextSpan: {
        color: C.white,
    },

    Latex: {
        color: C.white,
    },

    TitleFrame: {
        title_fill: '#333',
    },

    Plot: {
        grid_stroke: '#555',
    },

    Legend: {
        fill: '#333',
    },
}

const THEMES = {
    light: THEME_LIGHT,
    dark: THEME_DARK,
}

// theme state
let theme = null
function setTheme(names) {
    names = is_array(names) ? names : [ names ]
    theme = names.reduce((acc, name) => {
        const layer = is_string(name) ? THEMES[name] : name
        return { ...acc, ...layer }
    }, {})
}
setTheme('light')

// theme function
function THEME(args, elem) {
    // get element defaults
    const BOOLEANS_ELEMENT = BOOLEANS[elem] ?? {}
    const DEFAULTS_ELEMENT = theme[elem] ?? {}

    // map in booleans from args
    const ARGS_MAPPED = map_object(args, (k, v) => (v === true) && (k in BOOLEANS_ELEMENT) ? BOOLEANS_ELEMENT[k] : v)

    // return the whole shazam
    return { ...DEFAULTS_ELEMENT, ...ARGS_MAPPED }
}

//
// exports
//

export { CONSTANTS, DEFAULTS, DEBUG, setTheme, THEME }
