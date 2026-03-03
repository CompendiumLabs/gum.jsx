// gum.js

import './types/opentype.d.ts'
import './types/linebreak.d.ts'
import './types/katex.d.ts'

import { setTheme } from './lib/theme'
import { sans, mono, moji, light, bold, none, black, white, gray, blue, red, green, yellow, purple, lightgray, darkgray, e, pi, phi, r2d, d2r } from './lib/const'
import { is_scalar, is_string, is_boolean, is_object, is_function, is_array, zip, reshape, split, concat, slice, sum, prod, mean, add, sub, mul, div, cumsum, norm, range, linspace, enumerate, repeat, meshgrid, lingrid, exp, log, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, minimum, maximum, min, max, clamp, rescale, sigmoid, logit, smoothstep, random, uniform, normal, interp, palette, rounder } from './lib/utils'
import { registerFont } from './fonts/fonts'

import { Context, Element, Group, Svg, Rectangle, Spacer, is_element } from './elems/core'
import { Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute } from './elems/layout'
import { Line, UnitLine, VLine, HLine, Square, Ellipse, Circle, Dot, Ray, Shape, Triangle, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, RoundedRect, ArrowHead, Arrow } from './elems/geometry'
import { Span, Text, TextBox, TextFrame, TextStack, Bold, Italic, Latex, Equation } from './elems/text'
import { ArrowSpline, Node, Edge, Network } from './elems/network'
import { SymPoints, SymLine, SymSpline, SymShape, SymFill, Field, SymField } from './elems/symbolic'
import { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend } from './elems/plot'
import { TitleBox, TitleFrame, Slide } from './elems/slide'
import { Katex } from './elems/katex'
import { Image } from './elems/image'

const Rect = Rectangle

const CONST = {
    e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, light, bold,
}

const UTILS = {
    range, linspace, enumerate, repeat, meshgrid, lingrid, zip, reshape, split, concat, slice, add, sub, mul, div, sum, prod, mean, cumsum, min, max, minimum, maximum, norm, clamp, rescale, exp, log, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, sigmoid, logit, smoothstep, rounder, random, uniform, normal, interp, palette,
}

const ELEMS = {
    Context, Element, Group, Svg, Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rectangle, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Shape, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Triangle, Arrow, Field, Span, Text, TextBox, TextFrame, TextStack, Bold, Italic, Latex, Equation, TitleBox, TitleFrame, ArrowHead, ArrowSpline, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, Katex, Image
}

const CONTEXT = { ...CONST, ...UTILS, ...ELEMS }

export {
    CONST, UTILS, ELEMS, CONTEXT, setTheme, registerFont,
    is_string, is_boolean, is_array, is_object, is_function, is_element, is_scalar,
    e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, sans, mono, moji, light, bold,
    range, linspace, enumerate, repeat, meshgrid, lingrid, zip, reshape, split, concat, slice, add, sub, mul, div, sum, prod, mean, cumsum, min, max, minimum, maximum, norm, clamp, rescale, exp, log, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, sigmoid, logit, smoothstep, rounder, random, uniform, normal, interp, palette,
    Context, Element, Group, Svg, Box, Frame, Stack, HWrap, VStack, HStack, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, Rectangle, Rect, RoundedRect, Square, Ellipse, Circle, Dot, Shape, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, CubicSplineCmd, Spline, Triangle, Arrow, Field, Span, Text, TextBox, TextFrame, TextStack, Bold, Italic, Latex, Equation, TitleBox, TitleFrame, ArrowHead, ArrowSpline, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymShape, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, BoxLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, Katex, Image
}

export type * from './lib/types'
