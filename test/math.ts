import { black, is_array, is_scalar, Element, Group, HStack, VStack, Box, Spacer, Rectangle, Span } from '../src/gum'

import type { Attrs } from '../src/gum'

type AtomClass = 'mord' | 'mop' | 'mbin' | 'mrel' | 'mopen' | 'mclose' | 'mpunct' | 'minner'

type MathClassedElement = Element & {
    leftClass?: AtomClass | null
    rightClass?: AtomClass | null
}

type Measurement = {
    number: number
    unit: 'mu'
}

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

const BIN_LEFT_CANCELLER = new Set<AtomClass>(['mbin', 'mopen', 'mrel', 'mop', 'mpunct'])
const BIN_RIGHT_CANCELLER = new Set<AtomClass>(['mrel', 'mclose', 'mpunct'])

const ROW_PADDING = 0.05
const SCRIPT_SCALE = 1.0
const SCRIPT_SPACE = 0.05
const SCRIPT_SHIFT = 0.05

const FRAC_SCALE = 1.0
const FRAC_PAD = 0.06
const FRAC_RULE_SIZE = 0.015
const FRAC_RULE_GAP = 0.05
const FRAC_NO_RULE_GAP = 0.22
const FRAC_DELIM_GAP = 0.04

function set_math_classes(element: Element, leftClass: AtomClass | null, rightClass: AtomClass | null = leftClass): Element {
    const math = element as MathClassedElement
    math.leftClass = leftClass
    math.rightClass = rightClass
    return element
}

function get_math_classes(element: Element, fallbackClass: AtomClass | null = null): {
    leftClass: AtomClass | null
    rightClass: AtomClass | null
} {
    const math = element as MathClassedElement
    const leftClass = math.leftClass ?? fallbackClass
    const rightClass = math.rightClass ?? leftClass
    return { leftClass, rightClass }
}

function ensure_math_classes(element: Element, fallbackClass: AtomClass | null = null): Element {
    const { leftClass, rightClass } = get_math_classes(element, fallbackClass)
    return set_math_classes(element, leftClass, rightClass)
}

function empty_math(): Element {
    return set_math_classes(new Spacer(), null, null)
}

const EMPTY_MATH = empty_math()

function measurement_to_em(m: Measurement): number {
    return m.number / 18
}

function inter_atom_spacing(prev: AtomClass | null, next: AtomClass | null): number {
    if (prev == null || next == null) return 0
    const table = SPACING_TABLE[prev]
    const measurement = table?.[next]
    if (measurement == null) return 0
    return measurement_to_em(measurement)
}

function element_aspect(element: Element | null): number {
    return element?.spec.aspect ?? 1
}

function scale_element(element: Element, scale: number = SCRIPT_SCALE): Element {
    if (scale == 1) return element
    const ypad = (1 - scale) / 2
    const child = element.clone({ rect: [ 0, ypad, 1, 1 - ypad ] })
    return new Group({ children: [ child ], aspect: element_aspect(element) * scale })
}

function cancel_element_left_bin(element: Element): void {
    const { leftClass, rightClass } = get_math_classes(element)
    if (leftClass != 'mbin') return
    set_math_classes(element, 'mord', rightClass == 'mbin' ? 'mord' : rightClass)
}

function cancel_element_right_bin(element: Element): void {
    const { leftClass, rightClass } = get_math_classes(element)
    if (rightClass != 'mbin') return
    set_math_classes(element, leftClass == 'mbin' ? 'mord' : leftClass, 'mord')
}

function cancel_binary_atoms(items0: Element[]): Element[] {
    const items = items0.slice()
    let prevIndex: number | null = null

    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const { leftClass, rightClass } = get_math_classes(item)
        if (leftClass == null && rightClass == null) continue

        if (prevIndex == null) {
            cancel_element_left_bin(item)
        } else if (leftClass != null) {
            const prev = items[prevIndex]
            const { rightClass: prevRight } = get_math_classes(prev)

            if (prevRight == 'mbin' && BIN_RIGHT_CANCELLER.has(leftClass)) {
                cancel_element_right_bin(prev)
            }

            const prevClass = get_math_classes(prev).rightClass
            if (leftClass == 'mbin' && (prevClass == null || BIN_LEFT_CANCELLER.has(prevClass))) {
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

interface MathTextArgs extends Attrs {
    items?: MathItem | MathItem[]
    children?: MathItem | MathItem[]
    padding?: number
    defaultClass?: AtomClass | null
}

interface MathSpanArgs extends Attrs {
    children?: any
    klass?: AtomClass | null
    leftClass?: AtomClass | null
    rightClass?: AtomClass | null
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
    leftClass: AtomClass | null
    rightClass: AtomClass | null

    constructor(args: MathSpanArgs = {}) {
        const {
            children: children0 = '',
            klass = 'mord',
            leftClass = klass,
            rightClass = leftClass,
            ...attr
        } = args

        super({ children: children0, ...attr })
        this.args = args
        this.leftClass = leftClass
        this.rightClass = rightClass
    }
}

function normalize_math_children(children0: MathItem | MathItem[], defaultClass: AtomClass | null): Element[] {
    const children = is_array(children0) ? children0 : [ children0 ]
    const out: Element[] = []

    for (const child of children) {
        if (child == null) continue

        if (is_array(child)) {
            out.push(...normalize_math_children(child, defaultClass))
            continue
        }

        if (child instanceof MathText) {
            out.push(...child.items)
            continue
        }

        if (child instanceof MathSpan) {
            out.push(ensure_math_classes(child, defaultClass))
            continue
        }

        if (child instanceof Element) {
            out.push(ensure_math_classes(child, defaultClass))
            continue
        }

        if (is_scalar(child) || typeof child == 'string') {
            out.push(new MathSpan({ children: child, klass: defaultClass }))
        }
    }

    return out
}

class MathText extends HStack {
    leftClass: AtomClass | null
    rightClass: AtomClass | null
    items: Element[]

    constructor(args: MathTextArgs = {}) {
        const {
            items: items0,
            children: children0 = [],
            padding = ROW_PADDING,
            defaultClass = 'mord',
            ...attr
        } = args
        const rawItems = normalize_math_children(items0 ?? children0, defaultClass)
        const items = cancel_binary_atoms(rawItems)
        const children: Element[] = []
        const itemElements: Element[] = []
        let leftClass: AtomClass | null = null
        let rightClass: AtomClass | null = null
        let prevClass: AtomClass | null = null

        if (padding > 0 && items.length > 0) {
            children.push(new Spacer({ aspect: padding }))
        }

        for (const item of items) {
            const { leftClass: itemLeft, rightClass: itemRight } = get_math_classes(item, defaultClass)

            if (itemLeft && prevClass) {
                const gap = inter_atom_spacing(prevClass, itemLeft)
                if (gap > 0) children.push(new Spacer({ aspect: gap }))
            }

            children.push(item)
            itemElements.push(item)

            if (leftClass == null) leftClass = itemLeft
            if (itemRight != null) {
                prevClass = itemRight
                rightClass = itemRight
            }
        }

        if (padding > 0 && items.length > 0) {
            children.push(new Spacer({ aspect: padding }))
        }

        if (rightClass == null) rightClass = leftClass

        super({ children, ...attr })
        this.args = args
        this.leftClass = leftClass
        this.rightClass = rightClass
        this.items = itemElements

        set_math_classes(this, leftClass, rightClass)
    }
}

interface SupSubArgs extends Attrs {
    base: Element
    sup?: Element | null
    sub?: Element | null
    script_scale?: number
    script_space?: number
    script_shift?: number
}

class SupSub extends HStack {
    constructor(args: SupSubArgs) {
        const {
            base,
            sup = null,
            sub = null,
            script_scale = SCRIPT_SCALE,
            script_space = SCRIPT_SPACE,
            script_shift = SCRIPT_SHIFT,
            ...attr
        } = args

        const supElem = sup ? scale_element(sup, script_scale) : new Spacer()
        const subElem = sub ? scale_element(sub, script_scale) : new Spacer()
        const supBox = new Box({ children: [ supElem ], stack_size: (1 - script_space) / 2 })
        const subBox = new Box({ children: [ subElem ], stack_size: (1 - script_space) / 2 })
        const spacer = new Spacer({ stack_size: script_space })
        const stack = new VStack({
            children: [ supBox, spacer, subBox ],
            justify: 'left',
            pos: [0.5, 0.5 + script_shift],
        })
        const side = new Box({ children: [ stack ] })

        super({ children: [ base, side ], ...attr })
        this.args = args
    }
}

interface FracArgs extends Attrs {
    numer: Element
    denom: Element
    has_bar?: boolean
    left?: Element | null
    right?: Element | null
    frac_scale?: number
    frac_pad?: number
    rule_size?: number
    rule_gap?: number
    no_rule_gap?: number
    delim_gap?: number
}

class Frac extends HStack {
    constructor(args: FracArgs) {
        const {
            numer,
            denom,
            has_bar = true,
            left = null,
            right = null,
            bar_rounded = 0.025,
            frac_scale = FRAC_SCALE,
            frac_pad = FRAC_PAD,
            rule_size = FRAC_RULE_SIZE,
            rule_gap = FRAC_RULE_GAP,
            no_rule_gap = FRAC_NO_RULE_GAP,
            delim_gap = FRAC_DELIM_GAP,
            ...attr
        } = args

        const numerElem = scale_element(numer, frac_scale)
        const denomElem = scale_element(denom, frac_scale)
        const coreAspect = Math.max(element_aspect(numerElem), element_aspect(denomElem)) + 2 * frac_pad

        const gapTop = has_bar ? rule_gap : no_rule_gap / 2
        const gapBot = has_bar ? rule_gap : no_rule_gap / 2
        const lineSize = has_bar ? rule_size : 0
        const sideSize = Math.max((1 - gapTop - gapBot - lineSize) / 2, 0.01)

        const numerBox = new Box({
            children: [ numerElem ],
            aspect: coreAspect,
            padding: [ frac_pad, 0 ],
            stack_size: sideSize,
        })
        const denomBox = new Box({
            children: [ denomElem ],
            aspect: coreAspect,
            padding: [ frac_pad, 0 ],
            stack_size: sideSize,
        })

        const coreChildren: Element[] = [
            numerBox,
            new Spacer({ stack_size: gapTop }),
        ]

        if (has_bar) {
            coreChildren.push(new Rectangle({ fill: black, rounded: bar_rounded, stack_size: lineSize }))
        }

        coreChildren.push(
            new Spacer({ stack_size: gapBot }),
            denomBox,
        )

        const core = new VStack({ children: coreChildren, justify: 'center' })

        const children: Element[] = []
        if (left != null) children.push(left, new Spacer({ aspect: delim_gap }))
        children.push(core)
        if (right != null) children.push(new Spacer({ aspect: delim_gap }), right)

        super({ children, ...attr })
        this.args = args
    }
}

const Fraction = Frac

export {
    MathSpan, MathText, SupSub, Frac, Fraction,
    EMPTY_MATH,
    set_math_classes, get_math_classes,
}
export type { AtomClass, MathItem }
