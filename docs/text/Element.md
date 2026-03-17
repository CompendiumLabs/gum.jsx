# Element

The base class for all `gum.jsx` objects. You will usually not be working with this object directly unless you are implementing your own custom elements. An **Element** has a few methods that can be overriden, each of which takes a [Context](/docs/Context) object as an argument. The vast majority of implementations will override only `props` and `inner` (for non-unary elements).

The position and size of an element are specified in the internal coordinates (`coord`) of its parent, which defaults to the unit square. Rectangles are always specified in `[left, top, right, bottom]` format. You can also specify the placement by specifying `pos` and `rad` or various combinations of `xrad`/`yrad` and `xrect`/`yrect`. When not specified, `rect` defaults to the unit square.

Parameters:
- `tag` = `g` — the SVG tag associated with this element
- `unary` = `false` — whether there is inner text for this element
- `aspect` = `null` — the width to height ratio for this element
- `pos` — the desired position of the center of the child's rectangle
- `rad` ­— the desired radius of the child's rectangle (can be single number or pair)
- `xrad`/`yrad` ­— specify the radius for a specific dimension (and expand the other)
- `rect` — a fully specified rectangle to place the child in (this will override `pos`/`rad`)
- `aspect` — the aspect ratio of the child's rectangle
- `expand` — when `true`, instead of embedding the child within `rect`, it will make the child just large enough to fully contain `rect`
- `align` — how to align the child when it doesn't fit exactly within `rect`, options are `left`, `right`, `center`, or a fractional position (can set vertical and horizontal separately with a pair)
- `rotate` — how much to rotate the child by (degrees counterclockwise)
- `spin` — like rotate but will maintain the same size
- `flex` ­— override to set `aspect = null`
- `...` = `{}` — additional attributes that are included in `props`

Methods:
- `props(ctx)` — returns a dictionary of attributes for the SVG element. The default implementation returns the non-null `attr` passed to the constructor
- `inner(ctx)` — returns the inner text of the SVG element (for non-unary). Defaults to returing empty string
- `svg(ctx)` — returns the rendered SVG of the element as a `String`. Default implementation constructs SVG from `tag`, `unary`, `props`, and `inner`
