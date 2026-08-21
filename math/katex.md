# KaTeX coverage audit

An inventory of everything KaTeX accepts, cross-referenced against what
`src/elems/math.ts` actually renders. The point is to find the gaps worth
writing tests for — especially the ones that fail *silently*.

## Method

Every name was enumerated from the KaTeX registries (`/home/doug/src/KaTeX`,
v0.18.4) by importing the source modules directly:

```
functions.ts  → 310 functions      symbols.ts → 1488 math + 750 text entries
macros.ts     → 337 macros         environments.ts → 33 environments
```

Each was then rendered through `mathToSvg` (gum's own pipeline, using the
installed **katex 0.16.33** parser) and classified from the resulting SVG:

| verdict | how it is detected |
| --- | --- |
| `ok` | draws content, no diagnostics |
| `unsupported` | `convert_tree` logs `Unknown katex tree type` |
| `parse-error` | whole input drawn as red literal text (`parse_math`'s catch) |
| `no-op` | SVG is byte-identical to the same body *without* the command |
| `literal-leak` | a `<text>` run contains a raw `\command` |
| `missing-glyph` | `charToGlyphIndex` returns 0 for a drawn character |

Totals over 2856 probes: 2567 ok, 124 unsupported, 55 parse-error,
24 no-op, 22 literal-leak, 14 missing-glyph, 50 blank/warn.

**Status.** Five node types were implemented after the first pass of this
audit — `array` (§6), `horizBrace`, `accent` (stretchy), `accentUnder` and
`xArrow` (§2.1), and `operatorname` (§2.2) — along with one correctness bug in
already-supported functionality, spaces inside `\text{}` (§2.3). The §9.1
"easy" tier has since been cleared in full: the remaining KaTeX faces are
loaded (§3), the text accents resolve (§4), `\oiint`/`\oiiint` draw their
oval (§5), and sixteen more node types convert (§2). What is still missing is
`\middle`, `\tag`, the `CD` environment, and the three exotic enclosures,
all triaged in §9; the suite runs 119 passed, 1 failed (§10).

**Version note.** gum parses with katex 0.16.33 (`node_modules`), while the
inventory came from the 0.18.4 checkout. Only three names differ:
`\overbracket`, `\underbracket`, and text-mode `·` (U+00B7) exist in 0.18.4 but
not 0.16.33, so they parse-error rather than being gum gaps.

---

## Comparing renders

`math/compare.ts` puts gum's render and katex's (its real HTML pipeline, in
headless Chromium) side by side at the same pixels per em. Everything in this
document about *metrics* came from katex's `__renderToHTMLTree` heights and
depths; the comparison tool is for what those cannot see — widths, stroke
weights, glyph shapes. Its first runs found four things, all since fixed against katex's own geometry:

- `\x…` arrows were too short: katex pads the label by `0.5em` a side
  (`.x-arrow-pad`); gum was reusing amsmath's 2 mu *vertical* kern. Now
  `XARROW_PAD = 0.5`.
- the brace was too light: katex's path has a 0.12 em band along the runs,
  tapering into the hooks and peak; gum drew a uniform 0.05 stroke. The
  outline now carries a thickness per point (0.1 on the runs, 0.03 at the
  free ends and the peak tip), shared by `MathBrace` and the stretch table.
- `\overlinesegment` had its bar on the top edge with full-height ticks;
  katex's path is a 0.04 em bar through the *centre* of the box with ticks
  reaching 0.167 em above and below it (`|—|`), and the same shape serves
  `\underlinesegment`.
- `\left…\right` and matrix delimiters were shorter and bolder than katex's:
  gum picked the nearest size and scaled it to fit, and a stretched glyph
  thickens. `fit_delim` now does what TeX and katex's `traverseSequence` do —
  walk Main, Size1…4 and take the first whose natural extent covers the
  requirement, unscaled — and only stretches Size4 where TeX would build an
  extensible. In display mode every delimiter case now matches katex's
  height/depth (worst 0.032 em); the one docs example this changes is
  `docs/code/Bracket.jsx`.
- `\binom`'s parentheses were too small: TeX's Rule 15e gives a generalized
  fraction's delimiters a *fixed* size by style — `delim1` = 2.39 em in
  display, `delim2` = 1.01 em in text (1.157 in the script sizes) — rather
  than fitting the body, and katex's `genfrac` does the same. gum routed them
  through `Bracket`'s body fit. `Bracket` now takes `height` (total delimiter
  height in em) and the genfrac branch passes the rule's value; display and
  text `\binom`/`\dbinom`/`\tbinom` match katex to ≤ 0.013 em. Still open,
  and separate: script-style fractions differ from katex on their own (no
  delimiters involved), and in script style katex's delimiter sequence can
  choose a text-size `Main` glyph larger than the local em — so
  `x^{\binom{n}{k}}` is ~0.3 em short.

## 1. Parse-node coverage

KaTeX defines 57 parse-node types. `convert_tree` handles 41:

`mathord` `textord` `atom` `ordgroup` `op` `text` `font` `accent` `kern`
`spacing` `mclass` `lap` `htmlmathml` `styling` `supsub` `genfrac`
`underline` `overline` `sqrt` `leftright` `array` `horizBrace`
`accentUnder` `xArrow` `operatorname` `delimsizing` `color` `sizing`
`mathchoice` `phantom` `hphantom` `vphantom` `smash` `rule` `raisebox`
`enclose` `vcenter` `hbox` `pmb` `cr` `verb`

Nine more never reach the converter (the parser resolves them internally):
`infix` → `genfrac`, plus `internal` `raw` `size` `url` `color-token`
`accent-token` `op-token` `environment` `leftright-right`.

That leaves **two node types that reach `convert_tree` and hit the fallback**
(`middle` and `tag`), where the element is dropped and replaced by an empty
spacer, plus the `cdlabel`/`cdlabelparent` pair that only the `CD` environment
produces, and three `enclose` labels the converter declines (below).

## 2. Unsupported node types

Everything here renders as *nothing* (silently — only a `console.error`).

| node type | n | commands |
| --- | --- | --- |
| `middle` | 1 | `\middle` |
| `tag` | 3 | `\tag` `\tag@paren` `\tag@literal` |
| `enclose` (3 of 11 labels) | 3 | `\phase` `\angl` `\angln` — the body still draws, only the decoration is dropped |

The sixteen node types that used to sit in this table — `color` (64
commands, counting the Khan-Academy palette), `delimsizing` (16), `sizing`
(17), `mathchoice` (8: `\colon` `\bmod` `\pmod` `\mod` `\pod` `\minuso`),
`phantom`/`hphantom`/`vphantom`/`smash` (5), `rule` (3: `\rule` `\vdots`),
`raisebox` (7: `\dddot` `\ddddot` `\TeX` `\LaTeX` `\KaTeX`), `enclose`
(8: `\boxed` `\fbox` `\colorbox` `\fcolorbox` `\cancel` `\bcancel`
`\xcancel` `\sout`), `vcenter` `hbox` `pmb` `cr` `verb`, and the two mhchem
`xArrow` labels `\xrightequilibrium`/`\xleftequilibrium` — are all
implemented; §9.1 records how. Two notes from that work: a `color` node is a
fragment, so `\color{red}{2 +} 3` spaces like `2 + 3`; and a nested size
change (`\tiny a \small b`) is relative to the size in force, tracked by a
dynamically scoped `current_size` around the body.

Three of those items needed a small piece of new structure. `\smash` and
`\cancel` draw outside their layout box, so `MathSpec` gained `vink`, the
vertical ink range when it differs from `vrange` — the counterpart of the
`hrange` that `\rlap` already used — and `metrics_rect`/`place_items`/
`layoutMathRow` place children by their ink box while laying out by their
layout box. `\oiint` is a `MathOval` (an `Ellipse` stroked in em, like
`MathStretch`) over `\iint`. And `\overset`/`\underset`/`\stackrel`, which
§8 had listed as working, in fact produced an `op` node with a `body` and no
`name` that `MathOp` dropped; the `op` branch now converts such a body and the
`supsub` branch stacks on it as limits in every style, which is also what
`\dddot` needed.

### 2.1 Stretchy decorations

The `horizBrace` node (`\overbrace`/`\underbrace`), the stretchy half of
`accent` (`\overrightarrow` and friends), all of `accentUnder`, and 20 of the
22 `xArrow` commands now work — 42 commands off one piece of machinery.

No font carries stretchable versions of any of these; katex draws them all as
SVG paths, and so does gum. `MathStretch` holds a table of shapes keyed by
katex's own label, each drawing a **filled** outline into a box of katex's
`katexImagesData` height and minimum width. Filled rather than stroked, because
`stroke-width` is a pixel attribute that would not scale with the font — the
same reason `MathRule` fills a rectangle.

The arrows are **gum's own `Arrow`, `ArrowHead`, `Line` and `Arc`**, stroked
in em: `MathStretch.inner` rebases the context's stroke unit to its box's pixels
per em, so a `stroke_width` of `TEX.rule` is a TeX rule at any font size, and a
script-size arrow gets a proportionally thinner stroke than a display one in the
same image. That was the point of introducing the stroke unit (see CLAUDE.md,
Context System): before it, `Arrow` emitted a fixed pixel `stroke-width` and
could not be used for math at all, which is why the first version of these
drew filled polygons. The heads are `ArrowHead`'s open two-barb form, and
`ArrowHead` grew two options for it: `curve`, which makes each barb a circular
arc that leaves the tip turned toward the shaft and flares outward (`curve = 1`
is tangent to the shaft at the tip; Computer Modern's heads are close to 0.7,
which is what math uses), and `barb: 'left' | 'right'` so the harpoons could
keep one barb. The head's proportions come from the font: Computer Modern's →
has a head depth of 0.254 em against a half-height of 0.261 (ratio 0.97,
measured from the glyph outline), and since `ArrowHead`'s depth per half-height
is `cot(arc/2)`, math passes `arc = 92`. The barb ends stop half a stroke inside
the box so the round caps never leave it. Under-decorations (`accentUnder`) get
0.1 em of clearance below the body — a deliberate departure from katex's 0,
which let the barb tips touch the serif feet at the baseline; it shows up as
exactly +0.100 em of depth on those forms and nothing else; `\rightharpoonup` and friends now match
the font's own ⇀ ⇁ ↼ ↽ exactly, as do ↪/↩ (a half circle centred above the
stem, its upper arm free). A single-stem arrow is one `Arrow`; the double forms
(`\Rightarrow`) are two `Line`s that stop where they meet the barbs plus a
standalone `ArrowHead`; `\mapsto` adds a bar, `\hookrightarrow` an `Arc`, the
pairs stack two `Arrow`s. Braces, groups and the `\utilde` tilde are still
filled outlines (a centerline traced both ways along its normals); they could
move to stroked `Path`s now that strokes scale, which would also fix the brace
peak exactly.

One trap worth recording: `ArrowHead` and `Arc` draw in their own unit box and
are positioned by `pos`/`size`, so they must **not** be given the em `coord` —
only the point-based `Line`/`Arrow` take it. Passing it stretched every
standalone head over the whole decoration.

The three assemblies differ only in their kerns, which follow
katex: a stretchy accent sits directly on the body, `accentUnder` hangs beneath
it (with 0.12 em of clearance for `\utilde`), and an `xArrow` straddles the
math axis with its labels 2 mu clear at script size.

Verified against katex across 24 expressions: **every one within 0.033 em**, and
most within 0.011. Two details were worth getting right — katex hangs the upper
`xArrow` label from its *baseline* rather than its bottom, so an ordinary
descender drops into the gap and only a deep one (> 0.25 em) is pushed clear;
and `\utilde` is 0.26 em tall with no minimum width, not the 0.342 em of the
group shapes.

One trap: katex marks `\widehat`, `\widetilde` and `\widecheck` as stretchy
too, but those *do* have glyphs and gum already drew them correctly. The
converter only takes the drawn path for labels that are actually in the shape
table.

`\overgroup`/`\undergroup` are deliberately gum's own shape: a run with quarter-
ellipse hooks 1.8× wider than deep (`GROUP_SWEEP`) in a 0.26 em box — wider and
shallower than the old quarter-circle U, and not matched to either katex or
LaTeX, which differ from each other here.

Still missing: `\xrightequilibrium` and `\xleftequilibrium` (mhchem), and the
`\cd*` arrows that belong to the unimplemented `CD` environment.

#### Braces in particular

`\overbrace`/`\underbrace` are `MathBrace` (the shape) plus `HorizBrace` (the
assembly). The brace is four quarter circles — a hook at each end and a peak in
the middle — joined by straight runs, 0.548 em tall with a 1.6 em minimum
width. The body is set in display style with the brace 0.1 em beyond it, and a
script on the brace becomes a label 0.2 em further out: LaTeX passes the brace
like an operator with `\limits`, so `convert_tree` intercepts a `supsub` whose
base is a `horizBrace` and folds the script in. The body keeps its own baseline
and sets the brace width; a wider label overhangs it.

The brace alone is exact (`\overbrace{a+b}` matches katex to 0.001 em) and
labelled braces land within 0.037 em. The one larger residual,
`\underbrace{\sum_i a_i}_{k}` at 0.1 em, is gum's big-operator limit placement,
which is 0.1 em off from katex on its own before any brace is involved.

### 2.2 `operatorname`

`\operatorname` and the 12 macros built on it (`\limsup`, `\liminf`,
`\argmax`, `\argmin`, `\injlim`, `\projlim`, `\varlimsup`, …) now work. The
body is set upright and the whole name becomes a single Op atom; the starred
form stacks its scripts as limits, in display style only.

katex builds the body `withFont("mathrm")`, which gum cannot express through
`TEX_FONT_FAMILY` (§3), so the converter passes the upright face down directly.
Without that, `\varlimsup` — whose macro wraps its name in `\overline` — came
out italic, since rewriting only the top-level characters to text mode misses
anything nested. Metrics match katex within 0.019 em across 9 expressions.

### 2.3 Spaces in `\text{}`

Not a missing feature but a correctness bug in supported functionality, and the
most valuable single fix so far: `\text{a b}` and `\text{ab}` measured
identically. katex emits a space in text mode as its own `spacing` token, and
`compress_whitespace` ended in `.trimStart()`, so a token that *is* a single
space trimmed away to nothing — `\text{ and }` came out as "and" jammed against
its neighbours.

Worth noting how it evaded this audit: nothing throws, so strict mode (§7) does
not fire, and the probe compared each command against a control carrying the
same bug. Silent-but-plausible output is invisible to both.

## 3. Silently ignored — renders, but the command does nothing

These parse, draw, and produce **byte-identical output to the bare body**.
No diagnostic at all, so they are the easiest to ship a wrong picture with.

### Math and text font commands (`font` and `text` nodes) — fixed

At the time of the audit `TEX_FONT_FAMILY` mapped exactly one entry,
`mathbb → KaTeX_AMS`, and every other font command fell through, because
`MATH_FONTS` loaded only seven faces. `\mathrm{x}` stayed italic, `\mathcal{X}`
was an upright roman X, `\mathbf{x}` was not bold, and the whole `\text*`
family was identical to `\text`.

All of KaTeX's faces are now in `FONT_PATHS` and `MATH_FONTS`
(`src/fonts/fonts.ts`): `Main-Bold`, `Main-Italic`, `Main-BoldItalic`,
`Math-BoldItalic`, `Caligraphic`, `Fraktur`, `Script`, `SansSerif`,
`SansSerif-Bold`, `SansSerif-Italic`, and `Typewriter` on top of the original
seven. `TEX_FONT_FAMILY` is katex's `fontMap`; a face that lacks the glyph
(`\mathcal` lowercase, `\mathbb` digits) falls back to the symbol's own face,
as katex does, and `\boldsymbol` takes Math-BoldItalic for letters and
Main-Bold for everything else (`resolve_font_override`). The text commands
compose a family with a weight and a shape (`text_font_family`), so
`\textbf{\textit{x}}` is bold italic and `\emph` toggles.

One wrinkle worth knowing: the bold and italic faces are registered under
their own names for measurement (`KaTeX_Main-Bold`), but fontconfig and
katex.min.css know them as `KaTeX_Main` at weight 700 or style italic, so
`Span` emits the css face from `fontFace()` — family plus `font-weight`/
`font-style` — and the test report writes matching `@font-face` rules.

### Not actually bugs

`\relax`, `\mathord` on an already-ord group, `\mathopen`/`\mathclose` around a
lone ord, and `\def`/`\let`/`\newcommand` (which correctly match their
expansion) also register as no-ops. `\cfrac`, `\over`, `\choose`, `\atop`,
`\brace`, `\brack`, and `\above` all verified correct in nested position.

## 4. Literal command leaks — fixed

The command name was drawn *as visible text* in `KaTeX_Math`, usually including
a notdef box for the backslash. 30 commands did this at the time of the audit;
none do now.

The 8 stretchy over-accents that used to lead this list (`\overrightarrow` and
friends, which drew their own command name over the body) were fixed first —
see §2.1. The other 22 were all text-mode: the whole `\'` `` \` `` `\^` `\~`
`\=` `\u` `\.` `\"` `\c` `\r` `\H` `\v` set plus `\textcircled`, and the
symbols built on them (`\aa` `\AA` `\copyright` `\textcopyright`
`\textregistered` `©` `®`). `Accent` looked every label up in the *math*
symbol table; the `accent` node carries its `mode`, which `Accent` now takes,
so `\'` resolves to U+02CA in text mode. Two placements follow katex: `\c`
hangs its cedilla from the base's ink bottom, and `\textcircled`'s ring is a
full-size glyph that overprints the base on its own baseline rather than
riding above the x-height.

## 5. Missing glyphs

Drawn, but the glyph is absent from the face gum resolves them to. Text
measurement falls back to the `.notdef` advance (0.25em) while the rasterizer
substitutes a different face for the actual outline, so these come out as
full-width glyphs crammed into quarter-width slots — visibly overlapping,
not blank.

| input | face | codepoint |
| --- | --- | --- |
| `\mathbb{a}` … lowercase, and `\mathbb{0}`–`\mathbb{9}` | `KaTeX_AMS` | U+61… / U+30… |
| `\oiint` `∯` | `KaTeX_Size2` | U+222F |
| `\oiiint` `∰` | `KaTeX_Size2` | U+2230 |
| `\origof` `⊶` | `KaTeX_Main` | U+22B6 |
| `\imageof` `⊷` | `KaTeX_Main` | U+22B7 |
| `\text{þ}` `\text{Þ}` `\text{ð}` `\text{Ð}` | `KaTeX_Main` | U+FE U+DE U+F0 U+D0 |

`\mathbb` is only correct for A–Z. KaTeX_AMS carries no blackboard lowercase or
digits at all (`charToGlyphIndex` returns 0), so `\mathbb{abc}` and
`\mathbb{012}` render as a pile of overlapping letters. Uppercase
`\mathbb{RNZQC}` is correct.

Only two rows here were gum's own gap, and both are closed. `\oiint`/`\oiiint`
have no glyph in any KaTeX face either — katex sets `\iint`/`\iiint` and
overlays an oval SVG path (`functions/op.js`) — so gum now does the same: a
`MathOval` (an `Ellipse` stroked in em, centred on the axis, with the mid-ring
and stroke of katex's `oiintSize1`/`Size2` paths) placed over `\iint`, at
text and display sizes. And with the font fallback of §3, `\mathbb{abc}` and
`\mathbb{012}` no longer pile up notdef boxes: the characters fall back to
their default face (italic letters, upright digits), which is what katex's
`makeOrd` does when a face has no metrics for the character. The rest are
katex-level limits that katex shares: `\origof`/`\imageof` are commented "not
in font" in katex's own symbol table, and KaTeX_Main has no thorn or eth
(§9.3). The table stays as a record, but the *tests* for those rows are gone —
a suite failure should mean work to do, and there is none here.

## 6. Environments

**32 of 33 now work.** They are all the same `array` node, implemented as
`MathArray` in `src/elems/math.ts`:

`array` `darray` `matrix` `pmatrix` `bmatrix` `Bmatrix` `vmatrix` `Vmatrix`
(and the six `*` starred variants) `smallmatrix` `cases` `dcases` `rcases`
`drcases` `aligned` `gathered` `align` `align*` `alignat` `alignat*`
`alignedat` `gather` `gather*` `split` `equation` `equation*` `subarray`

That one handler also brought in `\substack`, `\\` row breaks,
`\hline`/`\hdashline`, `|`/`:`/`||` column separators, per-column `l`/`c`/`r`
alignment, and `\\[len]` row gaps.

Two things were needed beyond the node handler itself:

- **Display mode.** The AMS environments (`align`, `gather`, `equation`,
  `split`, `alignat`, `subarray`) are gated in katex's *parser* on
  `displayMode`, which gum never passed. `parse_math` now derives it from the
  current style, which unlocked 12 environments at the cost of one line. It
  changes nothing else: 15 assorted formulas parse to byte-identical trees in
  both modes. The one visible side effect is `\tag`, which now parses into an
  (unsupported) `tag` node instead of failing outright — so it drops silently
  rather than showing red source text.
- **A `scale` on the metrics.** A style-scaled element's baseline sits
  `MATH_AXIS * scale` below its anchor, but `MathSpec` did not record the
  scale, so `baseline_extents` defaulted to 1 and overstated the height of
  every scaled cell by `0.25 * (1 - scale)`. `scale_math` now composes a
  `scale` onto the metrics and `baseline_extents` defaults to it. Every prior
  caller already passed the scale explicitly, so nothing else changed — and
  `smallmatrix`/`substack` went from 0.075 em out to exact.

Verified against katex's own layout (`__renderToHTMLTree` reports height and
depth in em) across 16 environments: **every one matches to within 0.008 em**,
and that residual is gum's `\frac`/`\sqrt` glyph metrics, not the array. Where
katex differs by more it is katex overshooting — its delimiters come in
discrete sizes, so a 2-row `cases` gets a 3.0 em brace around a 2.88 em body,
while gum stretches one to fit.

`CD` (commutative diagrams) is the one environment still incomplete: the array
lays out, but its arrows are `cdlabel`/`xArrow` nodes that remain unsupported.

Implementing `array` also exposed a latent delimiter bug: `\vert` and `\Vert`
have glyphs only in `KaTeX_Main` and `KaTeX_Size1` (real TeX builds tall bars
from extensible pieces), so `vmatrix`/`Vmatrix` picked a size font with no
glyph and drew `.notdef` boxes. `fit_delim` now skips sizes whose face lacks
the glyph and stretches the largest that has it.

## 7. Error-handling behavior and strict mode

By default every fallback in this document is silent or near-silent:
`parse_math` swallows parser exceptions and renders the raw TeX as red text,
`convert_tree` logs to `console.error` and substitutes an empty spacer, an
unknown command name is drawn verbatim, and a missing glyph is measured as
`.notdef`. That is right for authoring but useless for a test suite.

**Strict mode** (`src/lib/strict.ts`) turns each of those into a thrown
`StrictError`. It is off by default and threaded through the render entry
points as a `strict` flag:

```
evaluateGum(code, { strict: true })     mathToSvg(tex, { strict: true })
mathToElement / mathToPng / mathToKitty (inherit MathArgs)
gum --strict                            gum-tex --strict
```

The five kinds it reports, and the fallback each replaces:

| kind | replaces |
| --- | --- |
| `parse` | tex katex could not parse → red literal text |
| `node` | katex node with no gum equivalent → empty spacer |
| `symbol` | command name absent from katex's symbol table → drawn verbatim |
| `font` | tex font command with no gum face mapped → silently unchanged |
| `glyph` | character absent from the resolved face → measured as `.notdef` |

`scripts/test.ts` renders every example strictly to decide pass/fail, then
re-renders permissively so the report still shows what the document draws
alongside the reason it failed. An example that deliberately exercises a
permissive fallback opts out with a `@nostrict` comment —
`test/code/math_parse_error.jsx` is the only one.

## 8. What works

The supported surface is large and, where it is supported, accurate.

- **Symbols: 1447/1457 math entries and 727/733 text entries render correctly**
  — Greek, AMS arrows and relations, set/logic operators, delimiters,
  `\varnothing`, `\hbar`, `\beth`, the full arrow tables, and the Unicode
  aliases. Only the six rows in §5 fail.
- **Operators**: all 79 `op` entries, including `\sum` `\prod` `\int` `\iint`
  `\oint` `\oiint` `\bigcup` `\bigoplus`, all the named functions (`\sin` `\log`
  `\det` `\lim` …), and `\limits`/`\nolimits`.
- **Fractions**: `\frac` `\dfrac` `\tfrac` `\cfrac` `\binom` `\dbinom`
  `\tbinom` `\genfrac`, and the infix forms `\over` `\atop` `\above`
  `\choose` `\brace` `\brack`.
- **Scripts**: `\sup`/`\sub` at every nesting depth, limit vs. side placement,
  `\overset` `\underset` `\stackrel` (these three were in fact broken until
  the §9.1 work — see §2).
- **Delimiters**: `\left`…`\right` with auto-sizing and `\left.`/`\right.`,
  and the manual `\big` … `\Bigg` family with its `l`/`r`/`m` classes.
- **Radicals**: `\sqrt`, `\sqrt[n]{}`.
- **Rules/lines**: `\overline` `\underline` `\rule` `\vdots`.
- **Fonts**: every `\math*` face and the composing `\text*` family (§3).
- **Colour, size, boxes**: `\color` `\textcolor` and the palette macros;
  `\tiny` … `\Huge`; `\boxed` `\fbox` `\colorbox` `\fcolorbox` `\cancel`
  `\bcancel` `\xcancel` `\sout`; `\phantom` `\hphantom` `\vphantom`
  `\mathstrut` `\smash`; `\raisebox` `\vcenter` `\hbox` `\pmb`; `\verb`.
- **Style-dependent macros**: `\bmod` `\pmod` `\mod` `\pod` `\colon` `\minuso`
  (`mathchoice`), and `\dddot` `\ddddot` `\TeX` `\LaTeX` `\KaTeX`.
- **Spacing**: `\,` `\:` `\;` `\!` `\quad` `\qquad` `\thinspace` `\enspace`
  `\negthinspace` `\kern` `\mkern` `\hskip` `\mskip` `\hspace` `\nobreak`.
- **Styles**: `\displaystyle` `\textstyle` `\scriptstyle` `\scriptscriptstyle`,
  and correct cramped-style propagation.
- **Classes**: `\mathbin` `\mathrel` `\mathpunct` `\mathinner` with correct
  inter-atom spacing, and `\mathllap`/`\mathrlap`/`\mathclap`.
- **Macros**: `\def` `\gdef` `\edef` `\let` `\newcommand` `\renewcommand`
  `\providecommand` `\char` `\@char` `\bgroup`/`\egroup`.
- **Text mode**: `\text{…}`, nested `$…$` inside `\text`, the text accents
  and `\textcircled`/`\copyright`/`\aa`.

## 9. Triage

Every remaining gap in this document, sorted by what it would take rather than
by what it is. The "easy" tier is done; what follows records what each item
actually took, so the next pass knows where the pieces live.

### 9.1 Easy — done

| gap | commands | what it took |
| --- | --- | --- |
| **font faces** (§3) | ~29: `\mathrm` `\mathbf` `\mathit` `\mathcal` `\mathfrak` `\mathscr` `\mathsf` `\mathtt` `\boldsymbol` `\bm` … and `\textbf` `\textit` `\texttt` `\textsf` `\emph` … | Every face ships in `node_modules/katex/dist/fonts`; all are now in `FONT_PATHS`/`MATH_FONTS`, `FontFamily` is widened, `TEX_FONT_FAMILY` is katex's `fontMap`, and `text_font_family` composes the text family/weight/shape. `resolve_font_override` falls back to the symbol's own face when the requested one lacks the glyph (and does `\boldsymbol`'s per-character choice). Faces are measured by their own name but emitted as base family + weight/style (`fontFace`), since that is how fontconfig and browsers know them. |
| `phantom` `hphantom` `vphantom` `smash` | 5 | `phantom_math` keeps the body's layout box on a `MathSpacer` with the unwanted axis zeroed; `smash_math` keeps the ink as `vink` overhang. |
| `mathchoice` | 8 (`\colon` `\bmod` `\pmod` `\mod` `\pod` `\minuso` `⦵`) | Pick the branch by `style_size(style)`. |
| `sizing` | 17 (`\tiny` … `\Huge`) | `scale_math` by katex's `sizeMultipliers`, relative to the size in force (a dynamically scoped `current_size`). |
| `color` | 64 | `convert_tree(body, { ...attr, color }, style)`; `MathRule`/`MathBrace`/`MathStretch` take `color` as a `fill` alias and `Frac` forwards it to its bar, so the colour reaches every drawn shape. No name table needed — katex passes CSS colour names through and the palette macros expand to `\textcolor{#…}`. |
| `delimsizing` | 16 (`\big` … `\Bigg`, `l`/`r`/`m`) | `sized_delim` feeds katex's `sizeToMaxHeight` (1.2/1.8/2.4/3.0 em) to `fit_delim`, which picks Size1…4 by natural extent; the node's `mclass` sets the atom class. `<`/`>` normalise to `\langle`/`\rangle` for `\left` too. |
| `rule` | 3 (`\rule` `\vdots` `⋮`) | `MathRule` placed with its bottom `shift` above the baseline; zero-size rules become spacers. |
| `raisebox` | 7 (`\raisebox` `\dddot` `\ddddot` `\TeX` `\LaTeX` `\KaTeX` `≘`) | `place_items` at `y = -dy`. `\dddot` also needed `\overset`, which turned out to be broken (§2). |
| `enclose` | 8 of 11 (`\boxed` `\fbox` `\colorbox` `\fcolorbox` `\cancel` `\bcancel` `\xcancel` `\sout`) | `enclose_box`: `MathBox` padding of `\fboxsep` (+ rule), a background `Rectangle`, and `array_rules` for the frame. `enclose_cancel`: a `MathCancel` of em-stroked `Line`s whose box is carried as `hrange`/`vink` overhang, since the cancel package takes no space for its strokes. `enclose_sout`: a rule at half the x-height. |
| **text accents** (§4) | 22 | `Accent` takes the node's `mode` and looks the label up in the text symbol table; `\c` and `\textcircled` get their own placements. `\aa`, `\copyright` and `\textregistered` came free. |
| `\oiint` `\oiiint` (§5) | 2 | `convert_oiint`: `MathOp` for `\iint`/`\iiint` with a `MathOval` over it. |
| `\xrightequilibrium` `\xleftequilibrium` | 2 | `stretch_equilibrium`: `stretch_arrow` gained an `x` offset so the off-side harpoon can stop 0.5 em short. |
| `vcenter` `hbox` `pmb` `cr` | 5 | Re-anchor on the axis; convert the body; overprint at (0.02, −0.01) em; drop silently. |
| `verb` | 1 | A `MathSpan` in `KaTeX_Typewriter`; `\verb*` shows its spaces as ␣. |

### 9.2 Hard — needs new structure

| gap | why |
| --- | --- |
| `middle` (`\middle`) | The delimiter is sized to the *enclosing* `leftright`'s body, so it cannot be built bottom-up the way `convert_tree` works everywhere else. The shape of the fix: `leftright` splits its body on the middle nodes, converts each run, then fits left, middles and right against the combined extent — doable, but the handler stops being a straight recursion. |
| `tag` (3) | `\tag{1}` sets its number at the *margin* of the display, which needs a measure that gum's naturally-sized math box does not have. Wants a display container that knows its width. Low value on its own. |
| `CD` environment, `cdlabel`, `cdlabelparent` | The array lays out today; the arrows are per-cell stretchy arrows sized to their column and labelled above and below (`\cdrightarrow` and friends), plus vertical arrows spanning rows. New assembly, not a new shape. |
| script-style fraction and delimiter metrics | Noted at the end of *Comparing renders*: script-style fractions drift from katex on their own, and in script style katex's delimiter sequence can pick a text-size `Main` glyph larger than the local em, so `x^{\binom{n}{k}}` is ~0.3 em short. Accuracy work in `fit_delim`/`Frac`, not a missing feature. |
| big-operator ink overhang | Pre-existing and unrelated to the tiers above, but visible in `math_glyph_gaps.jsx`: a row ending in `\oint` or `\iiint` (Size2) is clipped at the right, because the glyph's ink runs past its advance (the italic correction) and `MathSpan` does not carry that as `hrange`. Fixing it means giving `MathSpan` an ink-wide `coord`/`aspect` while keeping the glyph at the left of its box. |

### 9.3 Won't fix

| gap | why |
| --- | --- |
| `\phase` `\angl` `\angln` | The three exotic `enclose` labels (steinmetz phase angle, actuarial angle). Low value; the body still renders and strict mode reports the dropped decoration. |
| `\mathbb` lowercase and digits | KaTeX_AMS carries no blackboard lowercase or digits, and neither does real LaTeX's msbm. gum now falls back to the default face for them (§5), which is at least legible; anything better means synthesizing glyphs. |
| `\origof` `\imageof` | katex's own symbol table comments these "not in font": U+22B6/U+22B7 are in no KaTeX face, so katex draws tofu too. |
| `\text{þ}` `\text{Þ}` `\text{ð}` `\text{Ð}` | KaTeX_Main has no thorn or eth. Same story. |
| `\overbracket` `\underbracket`, text-mode `·` | katex 0.18.4 only; gum parses with 0.16.33, so they parse-error. A version bump, not a gap. |
| `\href` `\url` `\htmlClass` `\htmlId` `\htmlStyle` `\includegraphics` | These need katex's `trust` option. Untrusted — the default — they arrive as `color` nodes and get drawn as error-coloured text, which is exactly katex's own behaviour, and `color` is now supported. |

### 9.4 Where that leaves the suite

§9.3 has been taken out of the suite: the `\mathbb` lowercase/digit rows and
the `\origof`/`\imageof`/thorn rows were tests that could only ever fail, so
`math_blackboard.jsx` covers the blackboard capitals that do exist and
`math_glyph_gaps.jsx` covers `\oiint`/`\oiiint`, which now pass.

With §9.1 cleared, the ten gap files all pass. `\middle` was moved out of
`math_delim_sizing.jsx` into its own `math_middle.jsx`, which is now the
single failing file and the only §9.2 item with a test.

## 10. Test files

The files this audit added all live in `test/code/` (alongside the 28
`math_*.jsx` that predate it), one feature per file, matching the existing
convention. Under strict mode (§7) the whole corpus runs 119 passed, 1 failed
— the one failure being `math_middle.jsx` — with no false positives in `docs/`
or `gala/`. A failing card still renders in `--report`, with the `StrictError`
above the picture, so you can see both the diagnosis and the damage. Rows keep
surviving anchor terms (`1 + … + 2`) so a dropped construct reads as a hole
rather than a blank card.

**The one remaining gap** — this will look wrong until the feature lands,
which is the point:

| file | covers |
| --- | --- |
| `math_middle.jsx` | `\middle` inside `\left...\right` |

**Former gaps, now regression coverage** — each of these failed (or silently
rendered the wrong thing) before §9.1:

| file | covers |
| --- | --- |
| `math_delim_sizing.jsx` | `\big` `\Big` `\bigg` `\Bigg`, `l`/`r`/`m` variants, `\big.`, `\bigl<` |
| `math_enclose.jsx` | `\boxed` `\fbox` `\colorbox` `\fcolorbox` `\cancel` `\bcancel` `\xcancel` `\sout` |
| `math_phantom.jsx` | `\phantom` `\hphantom` `\vphantom` `\mathstrut` `\smash` `\smash[b]` |
| `math_sizing.jsx` | `\tiny` … `\Huge`, nested size changes |
| `math_color.jsx` | `\color` `\textcolor`, palette macros, colour reaching rules/braces/delimiters |
| `math_rule_verb.jsx` | `\rule` (with shift) `\vdots` `\verb` `\verb*` `\raisebox` `\TeX` `\LaTeX` `\KaTeX` `\dddot` |
| `math_font_families.jsx` | `\mathrm` `\mathbf` `\mathit` `\mathcal` `\mathfrak` `\mathscr` `\mathsf` `\mathtt` `\boldsymbol`, and the per-glyph fallbacks |
| `math_text_styles.jsx` | `\textbf` `\textit` `\texttt` `\textsf` `\emph`, and their composition |
| `math_text_accents.jsx` | `\'e` `` \`a `` `\^o` `\~n` `\"u` `\c c` `\v s` `\textcircled` `\copyright` |
| `math_glyph_gaps.jsx` | `\oiint` `\oiiint` at text and display size, against `\int`/`\iint`/`\oint` |
| `math_mathchoice.jsx` | `\bmod` `\pmod` `\mod` `\pod` `\colon` `\minuso` `\mathchoice` in display and script style |
| `math_overset.jsx` | `\overset` `\underset` `\stackrel` (broken until §9.1, though §8 had claimed them) |
| `math_boxes.jsx` | `\vcenter` `\hbox` `\pmb` `\\` |

**Regression coverage for what already works** (the existing `math_*.jsx` files
cover symbols, sup/sub, fractions, sqrt, brackets, accents, ops, spacing,
styles, over/underline, negations, and parse errors):

| file | covers |
| --- | --- |
| `math_stretchy_accents.jsx` | `\overrightarrow` `\overleftrightarrow` `\overgroup` `\overlinesegment`, glyph accents |
| `math_accent_under.jsx` | `\underrightarrow` `\underleftrightarrow` `\undergroup` `\utilde` |
| `math_ext_arrows.jsx` | `\xrightarrow` `\xmapsto` `\xhookrightarrow` `\xrightleftharpoons` `\xrightequilibrium`, labels above and below |
| `math_operatorname.jsx` | `\operatorname` `\operatorname*` `\limsup` `\argmax` `\varlimsup` |
| `math_text_spacing.jsx` | spaces inside `\text{}` carry their advance |
| `math_horiz_brace.jsx` | `\overbrace` `\underbrace`, labels, nesting, minimum width |
| `math_array_matrix.jsx` | `pmatrix` `bmatrix` `vmatrix` `Vmatrix` `Bmatrix` `smallmatrix`, tall cells |
| `math_array_cases.jsx` | `cases` `aligned` `gathered` `substack` |
| `math_array_align.jsx` | `align` `alignat` `gather` `equation` `split` `subarray` (display-mode gated) |
| `math_array_rules.jsx` | `l`/`c`/`r` columns, `\|`/`:`/`\|\|` separators, `\hline` `\hdashline`, `\\[len]` |
| `math_symbol_sweep.jsx` | a dense grid of the 453 named math symbols that render today (of 459 total), to catch font-table regressions |
| `math_infix_frac.jsx` | `\over` `\atop` `\above` `\choose` `\brace` `\brack` |
| `math_macros.jsx` | `\def` `\newcommand` `\let` `\char` |
| `math_lap.jsx` | `\mathllap` `\mathrlap` `\mathclap` |
| `math_class_spacing.jsx` | `\mathbin` `\mathrel` `\mathpunct` `\mathinner` spacing |
| `math_blackboard.jsx` | `\mathbb`/`\Bbb` over the blackboard capitals KaTeX_AMS carries |
