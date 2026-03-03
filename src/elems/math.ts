import { black, vtext } from '../lib/const'
import { is_array, is_scalar, is_string, is_boolean, maximum } from '../lib/utils'
import { Element, Group, Rectangle, Spacer } from '../elems/core'
import { HStack, VStack, Box } from '../elems/layout'
import { Span } from '../elems/text'

import type { Measurement } from 'katex'
import type { Attrs, Padding } from '../lib/types'

//
// types
//

type FontFamily = 'KaTeX_Math' | 'KaTeX_Main' | 'KaTeX_AMS' | 'KaTeX_Size1' | 'KaTeX_Size2' | 'KaTeX_Size3' | 'KaTeX_Size4'

type AtomClass = 'mord' | 'mop' | 'mbin' | 'mrel' | 'mopen' | 'mclose' | 'mpunct' | 'minner'

type MathSpec = {
    left: AtomClass | null
    right: AtomClass | null
}

type MathElement = Element & {
    math?: Partial<MathSpec>
}

const OP_SYMBOL_FONT: FontFamily = 'KaTeX_Size1'

const THINSPACE: Measurement = { number: 3, unit: 'mu' }
const MEDIUMSPACE: Measurement = { number: 4, unit: 'mu' }
const THICKSPACE: Measurement = { number: 5, unit: 'mu' }

type SpacingTable = Partial<Record<AtomClass, Measurement>>
const SPACING_TABLE: Record<AtomClass, SpacingTable> = {
    mord: { mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mop: { mord: THINSPACE, mop: THINSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mbin: { mord: MEDIUMSPACE, mop: MEDIUMSPACE, mopen: MEDIUMSPACE, minner: MEDIUMSPACE },
    mrel: { mord: THICKSPACE, mop: THICKSPACE, mopen: THICKSPACE, minner: THICKSPACE },
    mopen: {},
    mclose: { mop: THINSPACE, mbin: MEDIUMSPACE, mrel: THICKSPACE, minner: THINSPACE },
    mpunct: {
        mord: THINSPACE,
        mop: THINSPACE,
        mrel: THICKSPACE,
        mopen: THINSPACE,
        mclose: THINSPACE,
        mpunct: THINSPACE,
        minner: THINSPACE,
    },
    minner: {
        mord: THINSPACE,
        mop: THINSPACE,
        mbin: MEDIUMSPACE,
        mrel: THICKSPACE,
        mopen: THINSPACE,
        mpunct: THINSPACE,
        minner: THINSPACE,
    },
}

//
// math metrics
//

function set_math(element: Element, updates: Partial<MathSpec>): Element {
    const e = element as MathElement
    const { left, right } = updates
    if (e.math == null) e.math = {}
    if (left != null) e.math.left = left
    if (right != null) e.math.right = right
    return e
}

function get_math(element: Element | null): MathSpec {
    const { left = null, right = null } = (element as MathElement)?.math ?? {}
    return { left, right }
}

const EMPTY_MATH = new Spacer()

//
// measurement conversion
//

function measurement_to_em(d: Measurement): number {
    const scale: Record<string, number> = {
        mu: 1 / 18,
        em: 1,
        pt: 1 / 10,
        ex: 0.431,
    }
    return d.number * (scale[d.unit] ?? 0)
}

function inter_atom_spacing(prev: AtomClass | null, next: AtomClass | null): number {
    if (prev == null || next == null) return 0
    const table = SPACING_TABLE[prev]
    const measurement = table?.[next]
    if (measurement == null) return 0
    return measurement_to_em(measurement)
}

function unwrap_singleton(value: any): any {
    return (is_array(value) && value.length == 1) ? value[0] : value
}

function scalar_text(value: any): string {
    const value0 = unwrap_singleton(value)
    if (value0 == null) return ''
    if (is_scalar(value0) || is_string(value0) || is_boolean(value0)) return String(value0)
    return ''
}

//
// binary atom cancellation
//

const BIN_LEFT_CANCELLER = new Set<AtomClass>(['mbin', 'mopen', 'mrel', 'mop', 'mpunct'])
const BIN_RIGHT_CANCELLER = new Set<AtomClass>(['mrel', 'mclose', 'mpunct'])

function cancel_element_left_bin(element: Element): void {
    const { left, right } = get_math(element)
    if (left != 'mbin') return
    set_math(element, { left: 'mord', right: right == 'mbin' ? 'mord' : right })
}
function cancel_element_right_bin(element: Element): void {
    const { left, right } = get_math(element)
    if (right != 'mbin') return
    set_math(element, { left: left == 'mbin' ? 'mord' : left, right: 'mord' })
}

function cancel_binary_atoms(items0: Element[]): Element[] {
    const items = items0.slice()
    let prevIndex: number | null = null

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const { left, right } = get_math(item)
        if (left == null && right == null) continue

        if (prevIndex == null) {
            cancel_element_left_bin(item)
        } else if (left != null) {
            const prev = items[prevIndex]
            const { right: prevRight } = get_math(prev)

            if (prevRight == 'mbin' && BIN_RIGHT_CANCELLER.has(left)) {
                cancel_element_right_bin(prev)
            }

            const { right: prevClass } = get_math(prev)
            if (left == 'mbin' && (prevClass == null || BIN_LEFT_CANCELLER.has(prevClass))) {
                cancel_element_left_bin(item)
            }
        }

        prevIndex = i
    }

    if (prevIndex != null) {
        cancel_element_right_bin(items[prevIndex])
    }

    return items
}

//
// math text
//

interface MathTextArgs extends Attrs {
    items?: MathItem | MathItem[]
    children?: MathItem | MathItem[]
    padding?: number
}

interface MathSpanArgs extends Attrs {
    children?: any
    klass?: AtomClass | null
    left?: AtomClass | null
    right?: AtomClass | null
}

type MathItem =
    | Element
    | MathText
    | MathSpan
    | string
    | number
    | boolean
    | null
    | undefined
    | MathItem[]

class MathSpan extends Span {
    constructor(args: MathSpanArgs = {}) {
        const {
            children: children0 = '',
            klass = 'mord',
            left = klass,
            right = left,
            font_family = null,
            ...attr
        } = args

        // convert children to text
        const text = scalar_text(children0)

        // pass to Span
        super({ children: [ text ], font_family, ...attr })
        this.args = args

        // set math metrics
        set_math(this, { left, right })
    }
}

function normalize_math_children(children0: MathItem | MathItem[]): Element[] {
    const children = is_array(children0) ? children0 : [ children0 ]
    const out: Element[] = []

    for (const child of children) {
        if (child == null) {
            continue
        } else if (is_array(child)) {
            out.push(...normalize_math_children(child))
            continue
        } else if (child instanceof MathText) {
            out.push(...child.children)
            continue
        } else if (child instanceof Element) {
            out.push(child)
            continue
        } else if (is_scalar(child) || is_string(child) || is_boolean(child)) {
            out.push(new MathSpan({ children: [ child ] }))
            continue
        } else {
            throw new Error(`Unknown math child type: ${typeof child}`)
        }
    }

    return out
}

class MathText extends HStack {
    constructor(args: MathTextArgs = {}) {
        const { children: children0, ...attr } = args

        // normalize children
        const rawItems = normalize_math_children(children0)
        const items = cancel_binary_atoms(rawItems)
        const children: Element[] = []

        // accumulate math metrics
        let left: AtomClass | null = null
        let right: AtomClass | null = null
        let prevClass: AtomClass | null = null

        // process items
        for (const item of items) {
            let { left: itemLeft, right: itemRight } = get_math(item)

            if (itemLeft && prevClass) {
                const gap = inter_atom_spacing(prevClass, itemLeft)
                if (gap > 0) children.push(new Spacer({ aspect: gap }))
            }

            children.push(item)

            if (left == null) left = itemLeft
            if (itemRight != null) {
                prevClass = itemRight
                right = itemRight
            }
        }

        // set default right
        if (right == null) right = left

        // pass to HStack
        super({ children, ...attr })
        this.args = args

        // compute combined math metrics
        set_math(this, { left, right })
    }
}

interface SupSubArgs extends Attrs {
    base: Element
    sup?: Element | null
    sub?: Element | null
    script_size?: number
}

class SupSub extends HStack {
    constructor(args: SupSubArgs) {
        const {
            base,
            sup = null,
            sub = null,
            spacing = 0,
            script_size = 0.5,
            sup_pos = 0.363,
            sub_pos = 1,
            ...attr
        } = args

        // get side aspect
        const supAspect = sup?.spec.aspect
        const subAspect = sub?.spec.aspect
        const maxAspect = maximum(supAspect, subAspect)
        const sideAspect = maxAspect != null ? maxAspect * script_size : undefined

        // get sup/sub offsets
        const supOffset = 0.363 + vtext
        const subOffset = 1 + vtext

        // make side group
        const supElem = sup?.clone({ pos: [ 0, supOffset ], yrad: script_size / 2, align: 'left' })
        const subElem = sub?.clone({ pos: [ 0, subOffset ], yrad: script_size / 2, align: 'left' })
        const side = new Group({ children: [ supElem, subElem ], aspect: sideAspect })

        // pass to HStack
        super({ children: [ base, side ], spacing, ...attr })
        this.args = args

        // compute combined math metrics
        set_math(this, get_math(base))
    }
}

interface FracArgs extends Attrs {
    numer: Element
    denom: Element
    has_bar?: boolean
    left?: Element | null
    right?: Element | null
    padding?: Padding
    rule_size?: number
    vshift?: number
}

class Frac extends Box {
    constructor(args: FracArgs) {
        const {
            numer,
            denom,
            has_bar = true,
            left = null,
            right = null,
            padding = [0.05, 0.1],
            rule_size = 0.015,
            vshift = 0.1,
            ...attr
        } = args

        // build numer and denom boxes
        const elemSize = (1 - rule_size) / 2
        const numerBox = new Box({ children: [ numer ], padding })
        const denomBox = new Box({ children: [ denom ], padding })

        // build children
        const children: Element[] = []
        children.push(numerBox.clone({ stack_size: elemSize }))
        if (has_bar) children.push(new Rectangle({ fill: black, stack_size: rule_size }))
        children.push(denomBox.clone({ stack_size: elemSize }))
        const stack = new VStack({ children, justify: 'center', pos: [0.5, 0.5 + vshift] })

        // pass to Box
        super({ children: [ stack ], ...attr })
        this.args = args
    }
}

interface SqrtArgs extends Attrs {
    body: Element
    index?: Element | null
    bar_size?: number
    bar_gap?: number
    body_pad?: number
    index_scale?: number
    index_gap?: number
    index_pos?: [number, number]
}

class Sqrt extends HStack {
    constructor(args: SqrtArgs) {
        const {
            body,
            index = null,
            rule_size = 0.035,
            padding = [0, 0.05, 0.2, 0],
            index_size = 0.5,
            index_pos = [0.75, 0.25],
            ...attr
        } = args

        // build radical
        const SQRT = new MathSpan({ children: [ '√' ], font_family: OP_SYMBOL_FONT })
        const radical = (index != null) ? new Box({
            children: [
                SQRT,
                index.clone({ pos: index_pos, yrad: index_size / 2, align: 'right' }),
            ],
        }) : SQRT

        // build body stack
        const bodyStack = new VStack({
            children: [
                new Rectangle({ fill: black, stack_size: rule_size }),
                new Box({ children: [ body ], padding }),
            ],
        })
        const core = new HStack({ children: [ radical, bodyStack ] })

        // pass to HStack
        super({ children: [ core ], ...attr })
        this.args = args
    }
}

interface BracketArgs extends Attrs {
    body: Element
    left?: Element | null
    right?: Element | null
}

class Bracket extends HStack {
    constructor(args: BracketArgs) {
        const {
            body,
            left = null,
            right = null,
            ...attr
        } = args

        // build children
        const children: Element[] = []
        if (left != null) children.push(left)
        children.push(body)
        if (right != null) children.push(right)

        // pass to HStack
        super({ children, justify: 'left', ...attr })
        this.args = args
    }
}

export {
    MathSpan, MathText, SupSub, Frac, Sqrt, Bracket,
    OP_SYMBOL_FONT, EMPTY_MATH,
    set_math, get_math, measurement_to_em,
}
export type { AtomClass, MathItem, MathSpec, FontFamily }
