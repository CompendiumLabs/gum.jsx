// common types

// basic geometry
type Point = [number, number]
type Rect = [number, number, number, number]
type Limit = [number, number]
type Size = [number, number]

// color
type RGBA = [number, number, number, number]

// metaposition: a location value optionally paired with a pixel offset
type MNumber = [number, number]
type MPoint = [MNumber, MNumber]

// alignment: named position or fractional 0-1
type Zone = 'inner' | 'outer'
type Side = 'left' | 'right' | 'top' | 'bottom'
type AlignValue = Side | 'center' | 'middle' | number
type Align = AlignValue | [AlignValue, AlignValue]

// direction: horizontal/vertical, cardinal, angle in degrees, or unit vector
type Orient = 'h' | 'v'
type Cardinal = 'n' | 'e' | 'w' | 's'
type Direc = Cardinal | number | Point

// padding/margin: number, point, or [p0, p1, p2, p3]
type PaddingValue = number | Point
type Padding = boolean | PaddingValue | [PaddingValue, PaddingValue, PaddingValue, PaddingValue]

// rounded: number, point, or [p0, p1, p2, p3]
type RoundedValue = number | Point
type Rounded = boolean | RoundedValue | [RoundedValue, RoundedValue, RoundedValue, RoundedValue]

// element args: the common pattern for component constructors
type Attrs = Record<string, any>

// layout spec: the keys extracted by spec_split
type Spec = {
    rect?: Rect
    coord?: Rect
    aspect?: number
    aspect0?: number
    expand?: boolean
    align?: Align
    rotate?: number
    invar?: boolean
}

export type { Point, Rect, Limit, Size, RGBA, MNumber, MPoint, AlignValue, Align, Zone, Side, Orient, Cardinal, Direc, RoundedValue, Padding, Rounded, Attrs, Spec }
