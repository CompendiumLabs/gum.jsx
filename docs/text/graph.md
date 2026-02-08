# Graph

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

This is the core graphing functionality used in [Plot](/docs/Plot) without the axes and labels. By default, the coordinate system is automatically inferred from the limits of child elements. This can be overridden with custom `xlim`/`ylim` specifications. The Elements that are passed to **Graph** can express their position and size information in this new coordinate system.

You'll often want to use this (directly or indirectly) to display mathematical curves, as they might otherwise come out looking upside down relative to what you expect (as higher y-values mean "down" in raw SVG).

Parameters:
- `xlim`/`ylim` = `[0, 1]` — the range over which to graph
- `padding` = `0` — limit padding to add when auto-detected from `elems`
- `coord` = `'auto'` — the coordinate system to use for the graph (overrides `xlim`/`ylim`)
