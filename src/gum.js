// gum.js

import { setTheme, sans, mono, moji, light, bold, none, black, white, gray, blue, red, green, yellow, purple, lightgray, darkgray, e, pi, phi, r2d, d2r } from './defaults.js'
import { is_scalar, is_string, is_object, is_function, is_array, zip, reshape, split, concat, slice, sum, prod, mean, add, sub, mul, div, cumsum, norm, range, linspace, enumerate, repeat, meshgrid, lingrid, exp, log, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, minimum, maximum, min, max, clamp, rescale, sigmoid, logit, smoothstep, random, uniform, normal, hexToRgba, interp, palette, rounder } from './lib/utils.js'
import { Context, Element, Group, Svg, Rect, is_element } from './elems/core.js'
import { Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Field, Spacer } from './elems/layout.js'
import { Line, UnitLine, VLine, HLine, Square, Ellipse, Circle, Dot, Ray, Shape, Triangle, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, RoundedRect, ArrowHead, Arrow } from './elems/geometry.js'
import { Span, Text, TextBox, TextFrame, TextStack, TextFlex, Bold, Italic, Latex, Equation } from './elems/text.js'
import { ArrowSpline, Node, Edge, Network } from './elems/network.js'
import { SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField } from './elems/symbolic.js'
import { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend } from './elems/plot.js'
import { TitleBox, TitleFrame, Slide } from './elems/slide.js'

//
// constants
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

const NUMBERS = [
    new NamedNumber('e', e),
    new NamedNumber('pi', pi),
    new NamedNumber('phi', phi),
    new NamedNumber('r2d', r2d),
    new NamedNumber('d2r', d2r),
    new NamedNumber('light', light),
    new NamedNumber('bold', bold),
]

const STRINGS = [
    new NamedString('none', none),
    new NamedString('white', white),
    new NamedString('black', black),
    new NamedString('blue', blue),
    new NamedString('red', red),
    new NamedString('green', green),
    new NamedString('yellow', yellow),
    new NamedString('purple', purple),
    new NamedString('gray', gray),
    new NamedString('lightgray', lightgray),
    new NamedString('darkgray', darkgray),
    new NamedString('sans', sans),
    new NamedString('mono', mono),
    new NamedString('moji', moji),
]

//
// scripting
//

const ELEMS = [
    Context, Element, Group, Svg, Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Shape, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Triangle, Arrow, Field, Span, Text, TextBox, TextFrame, TextStack, TextFlex, Bold, Italic, Latex, Equation, TitleBox, TitleFrame, ArrowHead, ArrowSpline, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide
]

const VALS = [
    ...NUMBERS, ...STRINGS, ...ELEMS, range, linspace, enumerate, repeat, meshgrid, lingrid, hexToRgba, interp, palette, zip, reshape, split, concat, slice, add, sub, mul, div, sum, prod, mean, exp, log, sin, cos, tan, min, max, minimum, maximum, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, norm, clamp, rescale, sigmoid, logit, smoothstep, rounder, random, uniform, normal, cumsum
]
const KEYS = VALS.map(g => g.name)

//
// exports
//

export {
    KEYS, VALS, Context, Element, Group, Svg, Box, Frame, Stack, HWrap, VStack, HStack, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Shape, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Triangle, Arrow, Field, Span, Text, TextBox, TextFrame, TextStack, TextFlex, Bold, Italic, Latex, Equation, TitleBox, TitleFrame, ArrowHead, ArrowSpline, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Labels, VLabels, HLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, range, linspace, enumerate, repeat, meshgrid, lingrid, hexToRgba, interp, palette, zip, reshape, split, concat, add, sub, mul, div, sum, prod, mean, exp, log, sin, cos, tan, min, max, minimum, maximum, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, norm, clamp, rescale, sigmoid, logit, smoothstep, rounder, random, uniform, normal, cumsum, e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, light, bold, is_string, is_array, is_object, is_function, is_element, is_scalar, setTheme
}
