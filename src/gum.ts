// gum.js

import './types/opentype.d.ts'
import './types/linebreak.d.ts'
import './types/katex.d.ts'

import { setTheme } from './lib/theme'
import { sans, mono, moji, cmoji, light, regular, bold, none, black, white, gray, blue, red, green, yellow, purple, lightgray, darkgray, slate, e, pi, phi, r2d, d2r } from './lib/const'
import { is_scalar, is_string, is_boolean, is_object, is_function, is_array, zip, reshape, split, concat, slice, sum, prod, mean, cumsum, norm, range, linspace, enumerate, repeat, meshgrid, lingrid, exp, log, log10, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, minimum, maximum, min, max, clamp, rescale, normalize, sigmoid, logit, smoothstep, setSeed, random, uniform, normal, integer, interp, palette, polar, polard, rounder, add2, sub2, mul2, div2, addn, subn, muln, divn, addc, subc, mulc, divc, conjc, normc, argc } from './lib/utils'
import { loadFonts, loadTextFonts, fontsLoaded, registerFonts, registerFont, registeredFonts } from './fonts/fonts'
import { loadMathFonts } from './fonts/math'
import { ELEMS, CONTEXT, registerContext, registerElements, type ElementConstructor } from './lib/registry'
import { is_emoji } from './lib/text'

import { Context, Element, Group, Svg, Rectangle, Spacer, is_element } from './elems/core'
import { Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute } from './elems/layout'
import { Line, UnitLine, VLine, HLine, CoordLine, Segments, Square, Ellipse, Arc, Circle, Dot, Ray, Polygon, Triangle, Fill, VFill, HFill, Path, Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, RoundedCornerCmd, CubicSplineCmd, Spline, RoundedRect, RoundedLine, ArrowHead, Arrow } from './elems/geometry'
import { spline1d, spline2d } from './lib/interp'
import { Span, TextLine, Text, TextBox, TextFrame, TextStack, Bullets, Bold, Italic } from './elems/text'
import { Node, Edge, Network } from './elems/network'
import { SymPoints, SymLine, SymSpline, SymPoly, SymFill, Field, SymField } from './elems/symbolic'
import { Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend } from './elems/plot'
import { LabelBox, TitleBox, TitleFrame, Slide, SLIDE_ASPECT } from './elems/slide'
import { MathSpan, MathSymbol, MathOp, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathArray, MathStretch, HorizBrace, MathText, SupSub, Frac, Underline, Overline, Sqrt, Accent, Bracket, Latex, Tex, TextMode } from './elems/math' // registers the math elements and fonts
import { PngImage, SvgImage, calcPngAspect } from './elems/image'
import { parseTable } from './lib/table'

const Rect = Rectangle

const CONST = {
    e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, slate, sans, mono, moji, cmoji, light, regular, bold,
}

const UTILS = {
    range, linspace, enumerate, repeat, meshgrid, lingrid, zip, reshape, split, concat, slice, sum, prod, mean, cumsum, min, max, minimum, maximum, norm, clamp, rescale, normalize, exp, log, log10, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, sigmoid, logit, smoothstep, polar, polard, rounder, interp, palette, add2, sub2, mul2, div2, addn, subn, muln, divn, addc, subc, mulc, divc, conjc, normc, argc, spline1d, spline2d,
}

const RAND = {
    setSeed, random, uniform, normal, integer,
}

// the core elements (the math elements register themselves in elems/math.ts)
const CORE_ELEMS: Record<string, ElementConstructor> = {
    Element, Group, Svg, Box, Frame, Stack, VStack, HStack, HWrap, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, CoordLine, Segments, Rectangle, Rect, RoundedRect, RoundedLine, Square, Ellipse, Arc, Circle, Dot, Polygon, Path, Spline, Triangle, Fill, VFill, HFill, Arrow, Field, Span, TextLine, Text, TextBox, TextFrame, TextStack, Bullets, Bold, Italic, LabelBox, TitleBox, TitleFrame, ArrowHead, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymPoly, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, PngImage, SvgImage
}

// bind the core names in evaluated JSX
registerContext({ ...CONST, ...UTILS, ...RAND })
registerElements(CORE_ELEMS)

export {
    ELEMS, CONTEXT, CORE_ELEMS, Context, registerContext, registerElements,
    setTheme, loadFonts, loadMathFonts, loadTextFonts, fontsLoaded, registerFonts, registerFont, registeredFonts, calcPngAspect, parseTable, SLIDE_ASPECT,
    is_string, is_boolean, is_array, is_object, is_function, is_element, is_scalar, is_emoji,
    e, pi, phi, r2d, d2r, none, white, black, blue, red, green, yellow, purple, gray, lightgray, darkgray, slate, sans, mono, moji, cmoji, light, regular, bold,
    range, linspace, enumerate, repeat, meshgrid, lingrid, zip, reshape, split, concat, slice, sum, prod, mean, cumsum, min, max, minimum, maximum, norm, clamp, rescale, normalize, exp, log, log10, sin, cos, tan, abs, pow, sqrt, sign, floor, ceil, round, atan, atan2, sigmoid, logit, smoothstep, polar, polard, rounder, interp, palette, add2, sub2, mul2, div2, addn, subn, muln, divn, addc, subc, mulc, divc, conjc, normc, argc, spline1d, spline2d,
    setSeed, random, uniform, normal, integer,
    Element, Group, Svg, Box, Frame, Stack, HWrap, VStack, HStack, Grid, Points, Anchor, Attach, Absolute, Spacer, Ray, Line, UnitLine, HLine, VLine, CoordLine, Segments, Rectangle, Rect, RoundedRect, RoundedLine, Square, Ellipse, Arc, Circle, Dot, Polygon, Path, Spline, Triangle, Fill, Arrow, Field, Span, TextLine, Text, TextBox, TextFrame, TextStack, Bullets, Bold, Italic, LabelBox, TitleBox, TitleFrame, ArrowHead, Node, Edge, Network, SymPoints, SymLine, SymSpline, SymPoly, SymFill, SymField, Bar, VBar, HBar, Bars, VBars, HBars, Scale, VScale, HScale, Label, HLabel, VLabel, Labels, HLabels, VLabels, Axis, HAxis, VAxis, OuterLabel, Mesh, HMesh, VMesh, Mesh2D, Graph, Plot, BarPlot, Legend, Slide, Latex, Tex, MathSpan, MathSymbol, MathOp, MathSpacer, MathRow, MathCol, MathBox, MathRule, MathArray, MathStretch, HorizBrace, MathText, SupSub, Frac, Underline, Overline, Sqrt, Accent, Bracket, TextMode, PngImage, SvgImage,
    Command, MoveCmd, LineCmd, ArcCmd, CornerCmd, RoundedCornerCmd, CubicSplineCmd,
}

export type { ElementConstructor }
export type { FontPath, FontFace } from './fonts/fonts'
export type { ThemeName } from './lib/theme'
export type { SplineFuncArgs } from './lib/interp'
export type { PngImageArgs, SvgImageArgs } from './elems/image'

export type * from './lib/types'
