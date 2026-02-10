// themes

import { none, black, white } from './const'
import { map_object, is_array, is_string } from './utils'

//
// base layer
//

type ThemeAttrs = Record<string, any>
type ThemeLayer = Record<string, ThemeAttrs>

const BOOLEANS: ThemeLayer = {
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

const THEME_LIGHT: ThemeLayer = {
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

const THEME_DARK: ThemeLayer = {
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

const THEMES: Record<string, ThemeLayer> = {
    light: THEME_LIGHT,
    dark: THEME_DARK,
}

//
// theme management
//

// theme state
let theme: ThemeLayer = THEME_LIGHT
function setTheme(names: string | ThemeLayer | (string | ThemeLayer)[]): void {
    const list = is_array(names) ? names as (string | ThemeLayer)[] : [names]
    theme = list.reduce<ThemeLayer>((acc, name) => {
        const layer = is_string(name) ? THEMES[name as string] : name as ThemeLayer
        return { ...acc, ...layer }
    }, {})
}

// theme function
function THEME<T extends Object>(args: T, elem: string): T {
    // get element defaults
    const BOOLEANS_ELEMENT = BOOLEANS[elem] ?? {}
    const DEFAULTS_ELEMENT = theme[elem] ?? {}

    // map in booleans from args
    const ARGS_MAPPED = map_object(args, (k: string, v: any) => (v === true) && (k in BOOLEANS_ELEMENT) ? BOOLEANS_ELEMENT[k] : v)

    // return the whole shazam
    return { ...DEFAULTS_ELEMENT, ...ARGS_MAPPED } as T
}

//
// exports
//

export { THEME, setTheme }
