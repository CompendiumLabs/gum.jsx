// Type definitions for gum.js
// Visualization library using JSX-like syntax for SVG generation

declare module 'gum' {
  // =============================================================================
  // Core Types
  // =============================================================================

  /** A point in 2D space [x, y] */
  export type Point = [number, number];

  /** A rectangle [x1, y1, x2, y2] */
  export type Rect = [number, number, number, number];

  /** A limit range [min, max] */
  export type Limit = [number, number];

  /** Alignment options */
  export type Alignment = 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom' | number;

  /** Direction */
  export type Direction = 'h' | 'v' | 'n' | 'e' | 's' | 'w' | number;

  /** Theme name */
  export type ThemeName = 'light' | 'dark';

  /** Meta-location: either a number or [value, offset] */
  export type MetaLoc = number | [number, number];

  /** Meta-position: [MetaLoc, MetaLoc] */
  export type MetaPos = [MetaLoc, MetaLoc];

  // =============================================================================
  // Spec and Attributes
  // =============================================================================

  /** Layout specification parameters */
  export interface Spec {
    rect?: Rect;
    aspect?: number | 'auto' | null;
    expand?: boolean;
    align?: Alignment | [Alignment, Alignment];
    rotate?: number;
    invar?: boolean;
    coord?: Rect | 'auto';
  }

  /** Convenience spec parameters */
  export interface SpecConvenience {
    pos?: Point;
    rad?: number | Point;
    xrad?: number;
    yrad?: number;
    xlim?: Limit;
    ylim?: Limit;
    flex?: boolean;
    spin?: number;
    hflip?: boolean;
    vflip?: boolean;
  }

  /** SVG attributes */
  export interface SvgAttributes {
    stroke?: string;
    stroke_width?: number;
    stroke_dasharray?: string | number;
    stroke_linecap?: 'butt' | 'round' | 'square';
    stroke_linejoin?: 'miter' | 'round' | 'bevel';
    fill?: string;
    opacity?: number;
    transform?: string;
    clip_path?: string;
    mask?: string;
    [key: string]: any;
  }

  /** Combined element arguments */
  export interface ElementArgs extends Spec, SpecConvenience, SvgAttributes {
    children?: any;
    tag?: string;
    unary?: boolean;
  }

  // =============================================================================
  // Context
  // =============================================================================

  export interface ContextArgs {
    prect?: Rect;
    coord?: Rect;
    transform?: string | null;
    prec?: number;
    meta?: Metadata | null;
  }

  export class Context {
    prect: Rect;
    coord: Rect;
    transform: string | null;
    prec: number;
    meta: Metadata;
    args: ContextArgs;

    constructor(args?: ContextArgs);
    clone(args?: Partial<ContextArgs>): Context;
    mapPoint(cpoint: Point | null, offset?: boolean): Point | null;
    mapRect(crect: Rect | null, offset?: boolean): Rect | null;
    mapSize(csize: Point | null, offset?: boolean): Point | null;
    map(spec?: Spec & { offset?: boolean }): Context;
  }

  export class Metadata {
    uuid: number;
    defs: string[];

    constructor();
    getUid(): string;
    addDef(def: string): void;
    svg(): string;
  }

  // =============================================================================
  // Base Classes
  // =============================================================================

  export class Element {
    tag: string;
    unary: boolean;
    spec: Spec;
    attr: SvgAttributes;
    args: ElementArgs;

    constructor(args?: ElementArgs);
    clone(args?: Partial<ElementArgs>): this;
    rect(ctx: Context): Rect;
    props(ctx: Context): SvgAttributes;
    inner(ctx: Context): string;
    svg(ctx?: Context): string;
  }

  export interface GroupArgs extends ElementArgs {
    clip?: boolean | Element;
    mask?: boolean | Element;
    debug?: boolean;
  }

  export class Group extends Element {
    children: Element[];

    constructor(args?: GroupArgs);
  }

  export class Debug extends Element {
    children: Element[];

    constructor(args?: ElementArgs);
  }

  // =============================================================================
  // SVG Container
  // =============================================================================

  export interface SvgArgs extends GroupArgs {
    size?: number | Point;
    padding?: number;
    bare?: boolean;
    dims?: boolean;
    filters?: any;
    view?: Rect;
    style?: string | null;
    xmlns?: string;
    font_family?: string;
    font_weight?: number;
    prec?: number;
  }

  export class Svg extends Group {
    size: Point;
    viewrect: Rect;
    style: Element;
    prec: number;

    constructor(args?: SvgArgs);
  }

  // =============================================================================
  // Layout Classes
  // =============================================================================

  export interface BoxArgs extends GroupArgs {
    padding?: number | Point | Rect;
    margin?: number | Point | Rect;
    border?: number;
    fill?: string;
    shape?: Element;
    rounded?: number | Point | Rect;
    adjust?: boolean;
  }

  export class Box extends Group {
    constructor(args?: BoxArgs);
  }

  export interface FrameArgs extends BoxArgs {}

  export class Frame extends Box {
    constructor(args?: FrameArgs);
  }

  export interface StackArgs extends GroupArgs {
    direc?: 'h' | 'v';
    spacing?: number;
    justify?: Alignment;
    even?: boolean;
  }

  export class Stack extends Group {
    constructor(args?: StackArgs);
  }

  export class VStack extends Stack {
    constructor(args?: Omit<StackArgs, 'direc'>);
  }

  export class HStack extends Stack {
    constructor(args?: Omit<StackArgs, 'direc'>);
  }

  export interface HWrapArgs extends StackArgs {
    padding?: number;
    wrap?: number | null;
    measure?: ((child: Element) => number) | null;
  }

  export class HWrap extends VStack {
    constructor(args?: HWrapArgs);
  }

  export interface GridArgs extends GroupArgs {
    rows?: number;
    cols?: number;
    widths?: number[];
    heights?: number[];
    spacing?: number | Point;
  }

  export class Grid extends Group {
    constructor(args?: GridArgs);
  }

  // =============================================================================
  // Placement Classes
  // =============================================================================

  export interface PointsArgs extends GroupArgs {
    shape?: Element;
    size?: number;
  }

  export class Points extends Group {
    constructor(args?: PointsArgs);
  }

  export interface AnchorArgs extends GroupArgs {
    direc?: 'h' | 'v';
    loc?: number | null;
    justify?: Alignment;
  }

  export class Anchor extends Group {
    constructor(args?: AnchorArgs);
  }

  export interface AttachArgs extends GroupArgs {
    offset?: number;
    size?: number;
    side?: 'left' | 'right' | 'top' | 'bottom';
  }

  export class Attach extends Group {
    constructor(args?: AttachArgs);
  }

  export interface AbsoluteArgs extends ElementArgs {
    size?: number | Point;
  }

  export class Absolute extends Element {
    child: Element;
    size: number | Point;

    constructor(args?: AbsoluteArgs);
  }

  // =============================================================================
  // Basic Geometry
  // =============================================================================

  export class Spacer extends Element {
    constructor(args?: ElementArgs);
  }

  export interface LineArgs extends ElementArgs {
    closed?: boolean;
  }

  export class Line extends Element {
    points: Point[];
    poly: boolean;

    constructor(args?: LineArgs);
  }

  export interface UnitLineArgs extends LineArgs {
    direc?: 'h' | 'v';
    loc?: number;
    lim?: Limit;
  }

  export class UnitLine extends Line {
    constructor(args?: UnitLineArgs);
  }

  export class VLine extends UnitLine {
    constructor(args?: Omit<UnitLineArgs, 'direc'>);
  }

  export class HLine extends UnitLine {
    constructor(args?: Omit<UnitLineArgs, 'direc'>);
  }

  export interface RectArgs extends ElementArgs {
    rounded?: number | Point;
  }

  export class Rect extends Element {
    rounded: number | Point | undefined;

    constructor(args?: RectArgs);
  }

  export class Square extends Rect {
    constructor(args?: RectArgs);
  }

  export class Ellipse extends Element {
    constructor(args?: ElementArgs);
  }

  export class Circle extends Ellipse {
    constructor(args?: ElementArgs);
  }

  export class Dot extends Circle {
    constructor(args?: ElementArgs);
  }

  export interface RayArgs extends LineArgs {
    angle: number;
    loc?: Point;
    size?: number | Point;
  }

  export class Ray extends Line {
    constructor(args?: RayArgs);
  }

  // =============================================================================
  // Path Classes
  // =============================================================================

  export class Path extends Element {
    cmds: Command[];

    constructor(args?: ElementArgs);
    data(ctx: Context): string;
  }

  export class Command {
    cmd: string;

    constructor(cmd: string);
    args(ctx: Context): string;
    data(ctx: Context): string;
  }

  export class MoveCmd extends Command {
    pos: Point;

    constructor(pos: Point);
  }

  export class LineCmd extends Command {
    pos: Point;

    constructor(pos: Point);
  }

  export class ArcCmd extends Command {
    pos: Point;
    rad: Point;
    large: number;
    sweep: number;

    constructor(pos: Point, rad: Point, large: number, sweep: number);
  }

  export class CornerCmd {
    pos0: Point;
    pos1: Point;

    constructor(pos0: Point, pos1: Point);
    data(ctx: Context): string;
  }

  export interface CubicSplineCmdArgs {
    pos1?: Point;
    pos2?: Point;
    dir1?: Point | null;
    dir2?: Point | null;
    tan1?: Point;
    tan2?: Point;
    curve?: number;
  }

  export class CubicSplineCmd extends Command {
    constructor(args?: CubicSplineCmdArgs);
  }

  export interface SplineArgs extends ElementArgs {
    dir1?: Point;
    dir2?: Point;
    curve?: number;
    closed?: boolean;
  }

  export class Spline extends Path {
    constructor(args?: SplineArgs);
  }

  export interface ArcArgs extends ElementArgs {
    deg0: number;
    deg1: number;
  }

  export class Arc extends Path {
    constructor(args?: ArcArgs);
  }

  export class Triangle extends Element {
    constructor(args?: ElementArgs);
  }

  export interface RoundedRectArgs extends ElementArgs {
    rounded?: number | Point | Rect;
    border?: number;
  }

  export class RoundedRect extends Path {
    constructor(args?: RoundedRectArgs);
  }

  export class Shape extends Element {
    points: Point[];

    constructor(args?: ElementArgs);
  }

  // =============================================================================
  // Arrow Classes
  // =============================================================================

  export interface ArrowHeadArgs extends ElementArgs {
    direc?: number;
    arc?: number;
    base?: boolean;
    exact?: boolean;
  }

  export class ArrowHead extends Path {
    constructor(args?: ArrowHeadArgs);
  }

  export interface ArrowArgs extends GroupArgs {
    direc?: number;
    tail?: number;
  }

  export class Arrow extends Group {
    constructor(args?: ArrowArgs);
  }

  export interface FieldArgs extends GroupArgs {
    shape?: Element;
    size?: number;
    tail?: number;
  }

  export class Field extends Group {
    constructor(args?: FieldArgs);
  }

  // =============================================================================
  // Text Classes
  // =============================================================================

  export interface TextSpanArgs extends ElementArgs {
    color?: string;
    voffset?: number;
    font_family?: string;
    font_size?: number | string;
    font_weight?: number;
    font_style?: string;
  }

  export class TextSpan extends Element {
    text: string;
    voffset: number;

    constructor(args?: TextSpanArgs);
  }

  export interface TextArgs extends HWrapArgs {
    justify?: Alignment;
  }

  export class Text extends HWrap {
    spans: Element[];

    constructor(args?: TextArgs);
  }

  export class Markdown extends Text {
    constructor(args?: TextArgs);
  }

  export interface TextStackArgs extends StackArgs {
    wrap?: number | null;
  }

  export class TextStack extends VStack {
    constructor(args?: TextStackArgs);
  }

  export interface TextBoxArgs extends BoxArgs {
    justify?: Alignment;
    wrap?: number;
  }

  export class TextBox extends Box {
    constructor(args?: TextBoxArgs);
  }

  export class TextFrame extends TextBox {
    constructor(args?: TextBoxArgs);
  }

  export interface TextFlexArgs extends ElementArgs {
    font_scale?: number;
    font_size?: number;
    spacing?: number;
    color?: string;
    voffset?: number;
  }

  export class TextFlex extends Element {
    text: string;

    constructor(args?: TextFlexArgs);
  }

  export interface LatexArgs extends ElementArgs {
    display?: boolean;
    voffset?: number;
  }

  export class Latex extends Element {
    math: string;
    vshift: number;

    constructor(args?: LatexArgs);
  }

  export class Equation extends Latex {
    constructor(args?: Omit<LatexArgs, 'display'>);
  }

  // =============================================================================
  // Symbolic Plotters
  // =============================================================================

  export interface SymPathArgs {
    fx?: ((t: number) => number) | null;
    fy?: ((t: number) => number) | null;
    xlim?: Limit;
    ylim?: Limit;
    tlim?: Limit;
    xvals?: number[];
    yvals?: number[];
    tvals?: number[];
    N?: number;
  }

  export interface SymPointsArgs extends GroupArgs, SymPathArgs {
    shape?: Element | ((x: number, y: number, t: number, i: number) => Element);
    size?: number | ((x: number, y: number, t: number, i: number) => number);
  }

  export class SymPoints extends Group {
    constructor(args?: SymPointsArgs);
  }

  export interface SymLineArgs extends LineArgs, SymPathArgs {}

  export class SymLine extends Line {
    constructor(args?: SymLineArgs);
  }

  export interface SymSplineArgs extends SplineArgs, SymPathArgs {}

  export class SymSpline extends Spline {
    constructor(args?: SymSplineArgs);
  }

  export interface SymShapeArgs extends ElementArgs, SymPathArgs {}

  export class SymShape extends Shape {
    constructor(args?: SymShapeArgs);
  }

  export interface SymFillArgs extends ElementArgs {
    fx1?: ((t: number) => number) | null;
    fy1?: ((t: number) => number) | null;
    fx2?: ((t: number) => number) | null;
    fy2?: ((t: number) => number) | null;
    xlim?: Limit;
    ylim?: Limit;
    tlim?: Limit;
    xvals?: number[];
    yvals?: number[];
    tvals?: number[];
    N?: number;
  }

  export class SymFill extends Shape {
    constructor(args?: SymFillArgs);
  }

  export interface SymFieldArgs extends SymPointsArgs {
    func: (x: number, y: number) => number | Point;
  }

  export class SymField extends SymPoints {
    constructor(args?: SymFieldArgs);
  }

  // =============================================================================
  // Network Classes
  // =============================================================================

  export interface ArrowSplineArgs extends GroupArgs {
    from: Point;
    to: Point;
    from_dir?: Direction;
    to_dir?: Direction;
    arrow?: boolean;
    from_arrow?: boolean;
    to_arrow?: boolean;
    arrow_size?: number;
    curve?: number;
  }

  export class ArrowSpline extends Group {
    constructor(args?: ArrowSplineArgs);
  }

  export interface NodeArgs extends FrameArgs {
    id?: string;
    wrap?: number;
  }

  export class Node extends Frame {
    id: string | undefined;

    constructor(args?: NodeArgs);
  }

  export interface EdgeArgs extends ElementArgs {
    from: string | Node;
    to: string | Node;
    from_dir?: Direction;
    to_dir?: Direction;
  }

  export class Edge extends Element {
    from: string | Node;
    to: string | Node;

    constructor(args?: EdgeArgs);
  }

  export interface NetworkArgs extends GroupArgs {
    xlim?: Limit;
    ylim?: Limit;
  }

  export class Network extends Group {
    constructor(args?: NetworkArgs);
  }

  // =============================================================================
  // Bar Classes
  // =============================================================================

  export interface BarArgs extends RoundedRectArgs {
    direc?: 'h' | 'v';
    size?: number;
    loc?: number;
    label?: string;
  }

  export class Bar extends RoundedRect {
    constructor(args?: BarArgs);
  }

  export class VBar extends Bar {
    constructor(args?: Omit<BarArgs, 'direc'>);
  }

  export class HBar extends Bar {
    constructor(args?: Omit<BarArgs, 'direc'>);
  }

  export interface BarsArgs extends GroupArgs {
    direc?: 'h' | 'v';
    width?: number;
    zero?: number;
  }

  export class Bars extends Group {
    constructor(args?: BarsArgs);
  }

  export class VBars extends Bars {
    constructor(args?: Omit<BarsArgs, 'direc'>);
  }

  export class HBars extends Bars {
    constructor(args?: Omit<BarsArgs, 'direc'>);
  }

  // =============================================================================
  // Plotting Classes
  // =============================================================================

  export interface ScaleArgs extends GroupArgs {
    locs: number[];
    direc?: 'h' | 'v';
    span?: Limit;
  }

  export class Scale extends Group {
    constructor(args?: ScaleArgs);
  }

  export class VScale extends Scale {
    constructor(args?: Omit<ScaleArgs, 'direc'>);
  }

  export class HScale extends Scale {
    constructor(args?: Omit<ScaleArgs, 'direc'>);
  }

  export interface LabelsArgs extends GroupArgs {
    direc?: 'h' | 'v';
    justify?: Alignment;
    loc?: number | null;
    prec?: number;
  }

  export class Labels extends Group {
    constructor(args?: LabelsArgs);
  }

  export class HLabels extends Labels {
    constructor(args?: Omit<LabelsArgs, 'direc'>);
  }

  export class VLabels extends Labels {
    constructor(args?: Omit<LabelsArgs, 'direc'>);
  }

  export interface AxisArgs extends GroupArgs {
    lim?: Limit;
    direc: 'h' | 'v';
    ticks?: number | number[];
    tick_side?: 'inner' | 'outer' | 'both' | 'none' | Limit;
    label_side?: 'inner' | 'outer';
    label_size?: number;
    label_offset?: number;
    label_justify?: Alignment;
    label_loc?: number | null;
    discrete?: boolean;
    prec?: number;
  }

  export class Axis extends Group {
    locs: number[];

    constructor(args?: AxisArgs);
  }

  export class HAxis extends Axis {
    constructor(args?: Omit<AxisArgs, 'direc'>);
  }

  export class VAxis extends Axis {
    constructor(args?: Omit<AxisArgs, 'direc'>);
  }

  export interface BoxLabelArgs extends AttachArgs {}

  export class BoxLabel extends Attach {
    constructor(args?: BoxLabelArgs);
  }

  export interface MeshArgs extends ScaleArgs {
    locs?: number | number[];
    lim?: Limit;
  }

  export class Mesh extends Scale {
    constructor(args?: MeshArgs);
  }

  export class HMesh extends Mesh {
    constructor(args?: Omit<MeshArgs, 'direc'>);
  }

  export class VMesh extends Mesh {
    constructor(args?: Omit<MeshArgs, 'direc'>);
  }

  export interface LegendArgs extends FrameArgs {
    lines?: any[];
    vspacing?: number;
    hspacing?: number;
  }

  export class Legend extends Frame {
    constructor(args?: LegendArgs);
  }

  export interface GraphArgs extends GroupArgs {
    xlim?: Limit;
    ylim?: Limit;
    padding?: number | Point;
    flip?: boolean;
  }

  export class Graph extends Group {
    constructor(args?: GraphArgs);
  }

  export interface PlotArgs extends BoxArgs {
    xlim?: Limit;
    ylim?: Limit;
    axis?: boolean;
    xaxis?: boolean | Element | null;
    yaxis?: boolean | Element | null;
    xticks?: number | number[];
    yticks?: number | number[];
    xanchor?: number;
    yanchor?: number;
    grid?: boolean | null;
    xgrid?: boolean | number[] | null;
    ygrid?: boolean | number[] | null;
    xlabel?: string | null;
    ylabel?: string | null;
    title?: string | null;
    tick_size?: number;
    label_size?: number;
    label_offset?: number | Point;
    title_size?: number;
    title_offset?: number;
    clip?: boolean;
  }

  export class Plot extends Box {
    constructor(args?: PlotArgs);
  }

  export interface BarPlotArgs extends PlotArgs {
    direc?: 'h' | 'v';
    xtick_side?: 'inner' | 'outer' | 'both' | 'none';
  }

  export class BarPlot extends Plot {
    constructor(args?: BarPlotArgs);
  }

  // =============================================================================
  // Slide Classes
  // =============================================================================

  export interface TitleFrameArgs extends BoxArgs {
    title?: string;
    title_size?: number;
    title_fill?: string;
    title_offset?: number;
    title_rounded?: number;
  }

  export class TitleFrame extends Box {
    constructor(args?: TitleFrameArgs);
  }

  export interface SlideArgs extends TitleFrameArgs {
    wrap?: number;
    spacing?: number;
    justify?: Alignment;
  }

  export class Slide extends TitleFrame {
    constructor(args?: SlideArgs);
  }

  // =============================================================================
  // Image Class
  // =============================================================================

  export interface ImageArgs extends ElementArgs {
    href?: string;
  }

  export class Image extends Element {
    constructor(args?: ImageArgs);
  }

  // =============================================================================
  // Helper Functions - Array Operations
  // =============================================================================

  /** Generator that zips iterables together */
  export function gzip<T extends any[][]>(...iterables: T): Generator<{ [K in keyof T]: T[K] extends (infer U)[] ? U : never }>;

  /** Zips arrays together */
  export function zip<T extends any[][]>(...arrays: T): { [K in keyof T]: T[K] extends (infer U)[] ? U : never }[];

  /** Reshapes a flat array into a 2D array */
  export function reshape<T>(arr: T[], shape: [number, number]): T[][];

  /** Splits an array into chunks of specified length */
  export function split<T>(arr: T[], len: number): T[][];

  /** Concatenates nested arrays */
  export function concat<T>(arrs: T[][]): T[];

  /** Creates a range of numbers */
  export function range(n: number): number[];
  export function range(start: number, stop: number): number[];
  export function range(start: number, stop: number, step: number): number[];

  /** Creates evenly spaced numbers */
  export function linspace(start: number, stop: number, n: number): number[];

  /** Enumerates an array as [index, value] pairs */
  export function enumerate<T>(arr: T[]): [number, T][];

  /** Repeats a value n times */
  export function repeat<T>(value: T, n: number): T[];

  /** Creates a meshgrid from arrays */
  export function meshgrid<T, U>(a: T[], b: U[]): [T, U][];

  /** Creates a linear grid */
  export function lingrid(xlim: Limit, ylim: Limit, n: number): Point[];

  // =============================================================================
  // Helper Functions - Math Operations
  // =============================================================================

  /** Sums array elements */
  export function sum(arr: number[]): number;

  /** Product of array elements */
  export function prod(arr: number[]): number;

  /** Cumulative sum */
  export function cumsum(arr: number[], first?: boolean): number[];

  /** Vector norm */
  export function norm(vals: number[], degree?: number): number;

  /** Exponential function */
  export function exp(x: number): number;

  /** Natural logarithm */
  export function log(x: number): number;

  /** Sine function */
  export function sin(x: number): number;

  /** Cosine function */
  export function cos(x: number): number;

  /** Tangent function */
  export function tan(x: number): number;

  /** Minimum value in array */
  export function min(arr: number[]): number;

  /** Maximum value in array */
  export function max(arr: number[]): number;

  /** Element-wise minimum */
  export function minimum(a: number, b: number): number;

  /** Element-wise maximum */
  export function maximum(a: number, b: number): number;

  /** Absolute value */
  export function abs(x: number): number;

  /** Power function */
  export function pow(x: number, y: number): number;

  /** Square root */
  export function sqrt(x: number): number;

  /** Sign function */
  export function sign(x: number): number;

  /** Floor function */
  export function floor(x: number): number;

  /** Ceiling function */
  export function ceil(x: number): number;

  /** Round function */
  export function round(x: number): number;

  /** Arctangent (single argument) */
  export function atan(x: number): number;

  /** Arctangent (two arguments) */
  export function atan2(y: number, x: number): number;

  /** Clamp value to range */
  export function clamp(x: number, lo: number, hi: number): number;

  /** Rescale value from one range to another */
  export function rescale(x: number, inRange: Limit, outRange: Limit): number;

  /** Sigmoid function */
  export function sigmoid(x: number): number;

  /** Logit function */
  export function logit(x: number): number;

  /** Smoothstep function */
  export function smoothstep(x: number): number;

  /** Random number in [0, 1) */
  export function random(): number;

  /** Uniform random in range */
  export function uniform(lo?: number, hi?: number): number;

  /** Normal/Gaussian random */
  export function normal(mean?: number, std?: number): number;

  // =============================================================================
  // Helper Functions - Color
  // =============================================================================

  /** Convert hex color to RGBA array */
  export function hexToRgba(hex: string): [number, number, number, number];

  /** Interpolate between two colors */
  export function interp(start: string, stop: string, x: number): string;

  /** Create a color palette function */
  export function palette(start: string, stop: string, clim?: Limit): (x: number) => string;

  // =============================================================================
  // Helper Functions - Formatting
  // =============================================================================

  /** Round number to specified precision */
  export function rounder(x: number | string, prec?: number): string;

  // =============================================================================
  // Helper Functions - Type Checks
  // =============================================================================

  /** Check if value is a string */
  export function is_string(x: any): x is string;

  /** Check if value is an array */
  export function is_array(x: any): x is any[];

  /** Check if value is an object */
  export function is_object(x: any): x is object;

  /** Check if value is a function */
  export function is_function(x: any): x is Function;

  /** Check if value is an Element */
  export function is_element(x: any): x is Element;

  /** Check if value is a scalar (number or null) */
  export function is_scalar(x: any): x is number | null;

  // =============================================================================
  // Theme Functions
  // =============================================================================

  /** Set the current theme */
  export function setTheme(theme: ThemeName | ThemeName[] | Record<string, any>): void;

  // =============================================================================
  // Constants
  // =============================================================================

  /** Euler's number */
  export const e: number;

  /** Pi */
  export const pi: number;

  /** Golden ratio */
  export const phi: number;

  /** Radians to degrees */
  export const r2d: number;

  /** Degrees to radians */
  export const d2r: number;

  /** No fill/stroke */
  export const none: string;

  /** White color */
  export const white: string;

  /** Black color */
  export const black: string;

  /** Blue color */
  export const blue: string;

  /** Red color */
  export const red: string;

  /** Green color */
  export const green: string;

  /** Yellow color */
  export const yellow: string;

  /** Purple color */
  export const purple: string;

  /** Gray color */
  export const gray: string;

  /** Light gray color */
  export const lightgray: string;

  /** Dark gray color */
  export const darkgray: string;

  /** Sans-serif font family */
  export const sans: string;

  /** Monospace font family */
  export const mono: string;

  /** Emoji font family */
  export const moji: string;

  /** Bold font weight */
  export const bold: number;

  // =============================================================================
  // Element Maps
  // =============================================================================

  /** Map of all element classes */
  export const ELEMS: Record<string, typeof Element>;

  /** Array of all exported values */
  export const VALS: any[];

  /** Array of all exported keys */
  export const KEYS: string[];
}

// =============================================================================
// Evaluation (from eval.js)
// =============================================================================

declare module 'gum/eval' {
  export interface EvaluateOptions {
    theme?: ThemeName | null;
    debug?: boolean;
    [key: string]: any;
  }

  /** Evaluate gum JSX code and return an Svg element */
  export function evaluateGum(code: string, options?: EvaluateOptions): Svg;
}

// =============================================================================
// Rendering (from render.js)
// =============================================================================

declare module 'gum/render' {
  export interface RenderOptions {
    size?: number | Point;
    background?: string;
  }

  /** Render SVG to PNG (returns Buffer in Node, Blob in browser) */
  export function renderPng(svg: string, options?: RenderOptions): Promise<Buffer | Blob>;

  /** Node.js renderer class */
  export class NodeRender {
    fonts: string[];
    Resvg: any;

    init(): Promise<void>;
    renderPng(svg: string, options?: RenderOptions): Buffer;
  }

  /** Browser renderer class */
  export class BrowserRender {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;

    init(): Promise<void>;
    makeCanvas(size?: Point, options?: { dpr?: number | null }): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D };
    renderPng(svg: string, options?: RenderOptions): Promise<Blob>;
  }
}

// =============================================================================
// Error Types (from types.js)
// =============================================================================

declare module 'gum/types' {
  /** Error when no code is provided */
  export class ErrorNoCode extends Error {
    constructor();
  }

  /** Error when code returns nothing */
  export class ErrorNoReturn extends Error {
    constructor();
  }

  /** Error when code returns a non-element */
  export class ErrorNoElement extends Error {
    value: any;
    constructor(value: any);
  }
}
