# Math Rendering in `gum.jsx`

This document describes how math rendering works (`src/elems/math.ts`), assesses the current design, and lays out a path for expanding capability and compatibility.

## Pipeline

Math rendering is a four-stage pipeline:

1. **Parse**: `Latex` calls KaTeX's internal parser (`__parse`) to turn a TeX string into KaTeX's parse tree. We use only the parser — none of KaTeX's layout or HTML/MathML emitters.
2. **Convert**: `convert_tree` walks the KaTeX AST and builds a tree of gum elements (`MathSymbol`, `SupSub`, `Frac`, `Sqrt`, `Accent`, `Bracket`, ...).
3. **Layout**: each math element computes its own *inline metrics* at construction time and lays out its children with explicit `rect`s in a local em-based coordinate system.
4. **Render**: the result is an ordinary gum `Group`/`Element` tree, so the standard `svg(ctx)` machinery renders it. Nothing downstream knows math is special.

The crucial property is that stage 3 produces plain gum elements. Math is not a separate rendering engine — it is a layout *protocol* layered on top of gum's existing rect/coord/aspect system.

## The inline metrics protocol

Every participant in math layout is a `WithMath<Element>` — a regular element carrying an extra `math: MathSpec` field:

```typescript
type MathSpec = {
    left: MathClass      // TeX atom class of the left edge (mord, mop, mbin, mrel, ...)
    right: MathClass     // atom class of the right edge
    advance: number      // width in em
    vrange: Limit        // vertical ink extent [lo, hi] in em (y-down)
    vanchor: number      // anchor line position within vrange
    italic: number       // superscript overhang past advance (TeX italic correction), usually 0
}
```

This is essentially TeX's `(width, height, depth)` box model plus atom classes, with one twist: instead of height/depth measured from a baseline, we store a `vrange` and a `vanchor`. The anchor is the **math axis** (the line through the middle of `=` and the fraction bar), not the text baseline. `metrics_bounds` re-expresses `vrange` relative to the anchor, and all horizontal layout aligns anchors at `y = 0`. The `italic` field is TeX's italic correction: superscripts (only) are shifted right by it, so scripts clear slanted glyphs like ∫ and *f*. Compound elements have `italic = 0`, matching TeX, where only character nuclei carry one.

Key functions:

- `ensure_math(element)` lifts any gum element into the protocol. A `Span` gets real font metrics; an arbitrary element (a `Square`, a `Plot`, anything) gets `advance = aspect`, a default 1em `vrange`, and an anchor at the math axis (`MATH_AXIS = 0.25` above the baseline). **This is the mixing mechanism**: any gum element can appear mid-formula and will be sized to 1em and centered on the axis.
- `with_math(element, patch, args)` clones an element while updating its `MathSpec` — layout is done functionally, by re-wrapping children with explicit rects. **Important:** `clone` re-runs the element's constructor, so anything an element needs to survive layout must be produced *by its constructor* (from `args`), not patched onto an instance afterward. This is why `MathOp` is a class rather than a fix-up function.
- Text metrics come from `lib/text.ts`, which measures actual glyph geometry via opentype.js — ink bounds (`yMin`/`yMax`), advance, and italic overhang (`xMax − advance`) — not TeX font metric tables. Tall glyphs (taller than 1em) are normalized into a 1em line box by `normalizeTextMetrics`; `raw_vrange` records where the ink actually sits inside that box.

## Layout primitives

Four small primitives do all the geometric work:

- **`MathRow`** — horizontal concatenation. Advances accumulate left to right; every child's anchor sits on `y = 0`; the row's `vrange` is the union of child bounds. This is TeX's `\hbox` with baseline alignment.
- **`MathCol`** — vertical stack (used by `Frac`). Children stack top-down at their natural heights; the column's anchor defaults to its vertical center but can be overridden (e.g. `Frac` moves it to the bar).
- **`MathBox`** — padding/repositioning wrapper around a single child, preserving its anchor.
- **`MathRule`** / **`MathSpacer`** — the fraction bar and glue. Spacers can carry named widths (`thin`/`medium`/`thick`) from the TeX spacing table.

`MathText` is `MathRow` plus TeX's horizontal spacing pass: it flattens children, runs **binary atom cancellation** (`cancel_binary_atoms`, the TeX rule that turns `mbin` into `mord` when a binary operator lacks an operand on either side), and inserts inter-atom glue from the classic spacing table (`SPACING_TABLE`, in `mu` units).

## Compound elements

Built from the primitives:

- **`SupSub`** — base + a shared script box placed after a small horizontal gap, with scripts scaled and positioned per the style rules below; with `limits: true` (big operators in display style) the scripts stack above and below instead.
- **`Frac`** — `MathCol` of numerator, pad, `MathRule`, pad, denominator; anchor relocated to the bar.
- **`Sqrt`** — a `MathBox` around the body plus a hand-drawn radical (`CoordLine` polyline scaled to the body box). Because the radical is drawn, it stretches to *any* body size — no glyph assembly needed.
- **`Accent`** — accent glyph overlaid above the base, both centered in a shared box.
- **`Bracket`/`Delim`** — delimiters use the KaTeX `Size1`–`Size4` fonts. `fit_delim_size` tries all five sizes and picks the one minimizing log-scale height error; `fit_delim` then *linearly rescales* the chosen glyph to exactly match the body height. Continuous scaling of a discretely-chosen glyph keeps stroke weight approximately right while fitting exactly.

## Symbols and fonts

- `lib/symbols.ts` is KaTeX's symbol table (de-flowed): TeX control sequence → font, atom family, and replacement character. `MathSymbol` looks up the entry, picks the font (`KaTeX_Math` italic for math-mode ordinals, `KaTeX_Main` otherwise, `KaTeX_AMS` for `\mathbb` etc.), and maps the family to an atom class.
- The KaTeX TTF fonts (Math Italic, Main, AMS, Size1–4) are bundled alongside the IBM Plex text fonts in `src/fonts/fonts.ts` and measured with opentype.js like any other font.
- Named operators (`\sin`, `\lim`) render as upright text; symbol operators (`\sum`, `\int`) are `MathOp` elements — a `MathSymbol` from `KaTeX_Size1` (text style) or `KaTeX_Size2` (display style) whose constructor undoes the tall-glyph normalization, boxes the glyph by its ink, and places its baseline so the ink is centered on the math axis (TeX Rule 13). The KaTeX operator glyphs are designed so this puts the baseline exactly 0.25em below the axis.

## Math styles

TeX's size regimes are threaded through conversion and layout as a `MathStyle`:

```typescript
type MathStyle = 'display' | 'text' | 'script' | 'scriptscript'
```

with fixed glyph scales 1 / 1 / 0.7 / 0.5. The style is a *construction-time parameter*, not a new element kind: every element's metrics are expressed in its own local em, and a parent placing a child in a smaller style simply multiplies the child's metrics by the relative scale (`scale_math`). Since rendering follows the metrics, scaling is pure arithmetic — no font machinery involved.

Style descent rules (TeX Appendix G, simplified):

- `SupSub` scripts descend one level (`script_style`: D,T → S; S,SS → SS — the scale bottoms out at 0.5 rather than shrinking geometrically).
- `Frac` contents descend in inline styles (`frac_style`: D → T at full scale; T → S; S,SS → SS).
- In script styles, `MathText` suppresses medium and thick inter-atom glue, keeping only thin spaces.
- In display style, symbol operators use the large-size font, and operators flagged `limits` in the AST place their scripts above/below (`SupSub` with `limits: true`, laid out as a centered `MathCol` anchored on the base's axis).
- `\displaystyle` etc. (`styling` nodes) switch the style mid-formula.

Script placement (`layout_scripts`) hangs each script from its bottom edge at a fixed axis-relative position (`SUP_BOTTOM`, `SUB_BOTTOM`); for bases taller than an em (fractions, bracketed groups, big operators) the scripts instead track the base's top and bottom edges (`SUP_DROP`, `SUB_DROP`), with a minimum vertical gap between the two. The superscript is additionally shifted right by the base's `italic` correction (Rule 18a); in the `limits` layout the sup moves right and the sub left by the full correction so their centers split it (Rule 13a). The sup/sub pair shares one inline box built with the same `with_math` + `metrics_rect` machinery as everything else. The placement constants live at the top of `math.ts` and are tuned by eye, not copied from TFM parameters.

## Error handling

- A TeX parse failure renders the raw source in red — visible and debuggable.
- An unrecognized AST node type logs to the console and renders as an **empty spacer** — the content silently vanishes (e.g. a `pmatrix` today renders as nothing). This should become a visible inline error too.

---

# Assessment

## What is right

The core abstraction is sound, and worth keeping:

1. **Math as a protocol, not an engine.** `MathSpec` + `ensure_math` is exactly the right interface for the stated goal of mixing math and gum arbitrarily. Any element with an aspect participates in a formula; any formula is an element that participates in gum layout. No other math renderer has this property, and it falls out of a ~40-line protocol.
2. **Anchor-based vertical layout.** Storing `vrange` + `vanchor` (rather than baseline height/depth) makes axis-centered alignment the default, which is what math wants, and generalizes cleanly to non-text elements that have no baseline.
3. **Selective adoption of TeX wisdom.** The spacing table, atom classes, bin cancellation, symbol table, and fonts are the parts of TeX that encode centuries of typographic judgment — they are data, cheap to adopt, and they are adopted. The parts *not* adopted (glyph assembly, exact TFM metrics) are the parts that cost complexity.
4. **Drawn rather than assembled stretchy shapes.** The `Sqrt` radical as a polyline is more elegant than TeX's multi-glyph assembly and stretches perfectly. This is the right instinct for `gum.jsx` and should be extended (stretchy accents, wide hats, braces, arrows) rather than walked back.
5. **Continuous delimiter fitting.** Discrete size choice + linear rescale is a good trade — simpler than KaTeX's stacked-glyph assembly and visually fine at moderate sizes.

## The style system (implemented)

The original version of this renderer had no notion of TeX's size regimes, and nearly every visible defect traced to that one gap: scripts sized from the base glyph's ink height, nested scripts shrinking geometrically past 0.5, integrals rendered at 1em, `\lim`/`\sum` limits beside instead of below, and full-size relation glue inside subscripts. The `MathStyle` threading described above fixed all of these with one mechanism — a construction-time parameter plus metrics arithmetic, leaving the protocol and primitives untouched.

Style-related refinements deliberately left out, in case they become worth doing:

- **Cramped styles** (used under fraction bars and radicals to lower superscripts slightly).
- **`genfrac` size overrides** (`\dfrac`/`\tfrac` carry an explicit style in the AST that could feed straight into the `style` prop).
- **TFM-exact shift parameters** — placement constants are tuned by eye, which is the intended trade.

## Coverage gaps (incremental, mostly easy)

These are additions to `convert_tree` plus small compounds, in rough order of value:

| Construct | AST type | Notes |
|---|---|---|
| Matrices/arrays | `array` | The big one — `pmatrix`, `cases`, `aligned`. A `MathTable` built from `MathRow`s/`MathCol`s with per-column alignment; `cases`/`pmatrix` wrap it in `Bracket`. Currently vanishes silently. |
| Text-mode spacing | `spacing` | `\text{for all }` drops its space today ("foralln"). Map to `MathSpacer`. |
| Over/underline | `overline`, `underline` | Trivial with `MathCol` + `MathRule`. |
| `\operatorname`, `\mathrm` etc. | `font`, `op` with body | `TEX_FONT_FAMILY` only knows `mathbb`; add `mathrm`, `mathbf`, `mathcal`, `mathsf`, `mathtt` (fonts already ship with KaTeX). |
| Explicit sizing | `delimsizing`, `sizing` | `\big` etc. — `Delim` already takes a `level`; just wire it. |
| Stretchy accents | `accent` (`isStretchy`) | `\widehat`, `\overbrace`: draw them (polyline/spline scaled to base width) in the `Sqrt` spirit, replacing the current fixed-glyph fallback. Also fixes `\vec`, which currently overlays a full-size → across the glyph. |
| Style/color nodes | `styling`, `color`, `phantom`, `rule` | `styling` becomes a `MathStyle` override; the rest are direct. |
| Line breaks | `cr` | Multi-line display math via `MathCol` with alignment (pairs with `array`). |

Unknown nodes should render a visible red placeholder (like the parse-error path) instead of an empty spacer.

## Smaller rough edges

- **Inline baseline integration is a fudge.** `MathText` shifts its coord by a constant `INLINE_SHIFT = -0.1` when `inline` is set (the `Tex` element). The real issue is that `Text`/`TextLine` has no baseline concept — lines are even VStacks — so math can't share a true baseline with surrounding prose. The `MathSpec` anchor machinery is exactly what `Text` layout would need; unifying them (giving `TextLine` anchor alignment) would delete the hack and improve mixed text generally. This is the most valuable *non-math* payoff of the math work.
- **Ink-bound metrics vs design metrics.** Measuring real glyph extents is mostly a feature (tight boxes, honest centering), but it makes layout twitchy: an `x`-height base vs an ascender base changes script geometry. With style-based fixed script scales this mostly stops mattering, but keep in mind that TeX's height/depth are *design* values chosen for consistency, and a per-font floor/ceiling on `vrange` (e.g. min height = x-height) may be worth adding for uniform script placement across bases.
- **`ensure_math` on non-text elements** centers them on the axis with a fixed 1em height. Consider letting arbitrary elements opt into the protocol declaratively — e.g. a `math` prop or a `MathBox`-style wrapper exposing `advance`/`vanchor` — so a diagram embedded in a formula can say "align my second row to the axis." Formalizing `MathSpec` as a public interface is what makes "more capable than TeX" real rather than incidental.
- **`Delim` sizing works, but not the way the code says.** `fit_delim`/`with_text_metrics` patch metrics onto a cloned instance, and those patches are then discarded when `MathRow` re-clones the element for layout (see the `clone` note above). What actually happens is that the delimiter's *normalized* 1em-line-box metrics get stretched over the target rect, which — because the tall-glyph normalization squeezes ink to exactly fill the box — makes the ink fill the body height. The result is right; the mechanism is accidental, and `fit_delim_size`'s "error" metric is comparing normalized heights that all equal 1. Delimiters should get the same treatment as `MathOp`: a `Delim` constructor that computes ink-true metrics itself, then a principled size choice. Extreme sizes (tall matrices) will also get thin strokes from rescaling; if that starts to matter, draw large delimiters as paths (the `Sqrt` approach) rather than adding KaTeX's glyph-stacking.
- **`Span`'s `vshift` is applied inconsistently for tall glyphs** — metrics shift by `vshift` in box units, but `props` shifts the SVG baseline by `vshift × font_height`; these agree only when the glyph fits in 1em. `MathOp` sidesteps this by choosing metrics that cancel `vshift` out; a cleaner `Span` would remove the need.

## Recommended sequence

1. ~~**`MathStyle` threading**~~ — done: script scale/shift rewrite in `SupSub`, display-size operators via `fit_op`, over/under limits, script-style glue suppression, `styling` nodes.
2. **`array` support + visible unknown-node errors** — largest compatibility win, and failures become diagnosable.
3. **Easy AST wins**: text-mode `spacing`, over/underline, font families, `delimsizing`.
4. **Drawn stretchy shapes**: `\widehat`, `\vec`, `\overbrace` as scaled paths.
5. **Baseline-aware `TextLine`** using the anchor protocol; delete `INLINE_SHIFT`.

None of these require abandoning the current architecture; all of them are extensions of the existing protocol. The design is right — it was under-parameterized (no style, now fixed) and remains under-covered (AST breadth), not wrong.
