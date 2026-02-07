// gum.js

import { CONSTANTS as C, setTheme } from './defaults.js'
import { is_scalar, is_string, is_object, is_function, is_array, zip, reshape, split, concat, slice, sum, prod, mean, add, sub, mul, div, cumsum, norm, range, linspace, enumerate, repeat, meshgrid, lingrid, exp, log, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, minimum, maximum, min, max, clamp, rescale, sigmoid, logit, smoothstep, random, uniform, normal, hexToRgba, interp, palette, rounder } from './lib/utils.js'
import { Context, Element, Group, Svg, Rect, is_element } from './elems/core.js'
import { Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Field, Spacer } from './elems/layout.js'
import { Line, UnitLine, VLine, HLine, Square, Ellipse, Circle, Dot, Ray, Shape, Triangle, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Arc, RoundedRect, ArrowHead, Arrow } from './elems/geometry.js'
import { Span, Text, TextBox, TextFrame, TextStack, TextFlex, Bold, Italic, Latex, Equation } from './elems/text.js'
import { ArrowSpline, Node, Edge, Network } from './elems/network.js'
import { SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField } from './elems/symbolic.js'
import { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend } from './elems/plot.js'
import { TitleBox, TitleFrame, Slide } from './elems/slide.js'

//
// core math
//

// to be used in functions
class NamedNumber extends Number {
    constructor(name, value) {
        super(value)
        this.name = name
    }
}

class NamedString extends String {
    constructor(name, value) {
        super(value)
        this.name = name
    }
}

// math
const e = new NamedNumber('e', C.e)
const pi = new NamedNumber('pi', C.pi)
const phi = new NamedNumber('phi', C.phi)
const r2d = new NamedNumber('r2d', C.r2d)
const d2r = new NamedNumber('d2r', C.d2r)

// colors
const none = new NamedString('none', C.none)
const white = new NamedString('white', C.white)
const black = new NamedString('black', C.black)
const blue = new NamedString('blue', C.blue)
const red = new NamedString('red', C.red)
const green = new NamedString('green', C.green)
const yellow = new NamedString('yellow', C.yellow)
const purple = new NamedString('purple', C.purple)
const gray = new NamedString('gray', C.gray)
const lightgray = new NamedString('lightgray', C.lightgray)
const darkgray = new NamedString('darkgray', C.darkgray)

// fonts
const sans = new NamedString('sans', C.sans)
const mono = new NamedString('mono', C.mono)
const moji = new NamedString('moji', C.moji)
const bold = new NamedNumber('bold', C.bold)

//
// scripting
//

const ELEMS = {
    Context, Element, Group, Svg, Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Shape, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Arc, Triangle, Arrow, Field, Span, Text, TextBox, TextFrame, TextStack, TextFlex, Bold, Italic, Latex, Equation, TitleBox, TitleFrame, ArrowHead, ArrowSpline, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide
}

const VALS = [
    ...Object.values(ELEMS), range, linspace, enumerate, repeat, meshgrid, lingrid, hexToRgba, interp, palette, zip, reshape, split, concat, slice, add, sub, mul, div, sum, prod, mean, exp, log, sin, cos, tan, min, max, minimum, maximum, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, norm, clamp, rescale, sigmoid, logit, smoothstep, rounder, random, uniform, normal, cumsum, e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, bold
]
const KEYS = VALS.map(g => g.name).map(g => g.replace(/\$\d+$/g, ''))

//
// exports
//

export {
    ELEMS, KEYS, VALS, Context, Element, Group, Svg, Box, Frame, Stack, HWrap, VStack, HStack, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Shape, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Arc, Triangle, Arrow, Field, Span, Text, TextBox, TextFrame, TextStack, TextFlex, Bold, Italic, Latex, Equation, TitleBox, TitleFrame, ArrowHead, ArrowSpline, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, range, linspace, enumerate, repeat, meshgrid, lingrid, hexToRgba, interp, palette, zip, reshape, split, concat, add, sub, mul, div, sum, prod, mean, exp, log, sin, cos, tan, min, max, minimum, maximum, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, norm, clamp, rescale, sigmoid, logit, smoothstep, rounder, random, uniform, normal, cumsum, e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, bold, is_string, is_array, is_object, is_function, is_element, is_scalar, setTheme
}
