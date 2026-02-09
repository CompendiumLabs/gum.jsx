// themes

import { none, black, white } from './const.js'
import { map_object, is_array, is_string } from './utils.js'

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
        color: black,
    },

    Graph: {
        padding: 0.1,
    },

    Plot: {
        margin: 0.2,
    },
}

//
// theme definitions
//

const THEME_LIGHT = {
    Svg: {
        fill: none,
        stroke: black,
    },

    Span: {
        color: black,
    },

    TitleBox: {
        title_fill: white,
    },

    Plot: {
        grid_stroke: '#ddd',
    },
}

const THEME_DARK = {
    Svg: {
        fill: none,
        stroke: white,
    },

    Dot: {
        color: white,
    },

    Span: {
        color: white,
    },

    Latex: {
        color: white,
    },

    TitleBox: {
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

//
// theme management
//

// theme state
var theme = THEME_LIGHT
function setTheme(names) {
    names = is_array(names) ? names : [ names ]
    theme = names.reduce((acc, name) => {
        const layer = is_string(name) ? THEMES[name] : name
        return { ...acc, ...layer }
    }, {})
}

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

export { THEME, setTheme }
