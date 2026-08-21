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

**Status.** Five node types have been implemented since the first pass of this
audit — `array` (§6), `horizBrace`, `accent` (stretchy), `accentUnder` and
`xArrow` (§2.1), and `operatorname` (§2.2) — along with one correctness bug in
already-supported functionality, spaces inside `\text{}` (§2.3).

**Version note.** gum parses with katex 0.16.33 (`node_modules`), while the
inventory came from the 0.18.4 checkout. Only three names differ:
`\overbracket`, `\underbracket`, and text-mode `·` (U+00B7) exist in 0.18.4 but
not 0.16.33, so they parse-error rather than being gum gaps.

---

## 1. Parse-node coverage

KaTeX defines 57 parse-node types. `convert_tree` handles 25:

`mathord` `textord` `atom` `ordgroup` `op` `text` `font` `accent` `kern`
`spacing` `mclass` `lap` `htmlmathml` `styling` `supsub` `genfrac`
`underline` `overline` `sqrt` `leftright` `array` `horizBrace`
`accentUnder` `xArrow` `operatorname`

Nine more never reach the converter (the parser resolves them internally):
`infix` → `genfrac`, plus `internal` `raw` `size` `url` `color-token`
`accent-token` `op-token` `environment` `leftright-right`.

That leaves **20 node types that reach `convert_tree` and hit the fallback**,
where the element is dropped and replaced by an empty spacer.

## 2. Unsupported node types

Everything here renders as *nothing* (silently — only a `console.error`).

| node type | n | commands |
| --- | --- | --- |
| `color` | 64 | `\textcolor` `\color` `\href` `\url` `\htmlClass` `\htmlId` `\htmlStyle` `\includegraphics`, plus the 56 Khan-Academy palette macros (`\blue` `\red` `\greenA` `\kaBlue` …) |
| `cr` | 2 | `\\` `\newline` |
| `delimsizing` | 16 | `\big` `\Big` `\bigg` `\Bigg` and the `l`/`r`/`m` variants |
| `enclose` | 11 | `\boxed` `\fbox` `\colorbox` `\fcolorbox` `\cancel` `\bcancel` `\xcancel` `\sout` `\phase` `\angl` `\angln` |
| `hbox` | 1 | `\hbox` |
| `mathchoice` | 8 | `\mathchoice` `\colon` `\bmod` `\pmod` `\mod` `\pod` `\minuso` `⦵` |
| `middle` | 1 | `\middle` |
| `phantom` `hphantom` `vphantom` | 4 | `\phantom` `\hphantom` `\vphantom` `\mathstrut` |
| `pmb` | 1 | `\pmb` |
| `raisebox` | 7 | `\raisebox` `\dddot` `\ddddot` `\TeX` `\LaTeX` `\KaTeX` `≘` |
| `rule` | 3 | `\rule` `\vdots` `⋮` |
| `sizing` | 17 | `\tiny` `\scriptsize` `\small` `\normalsize` `\large` `\Large` `\LARGE` `\huge` `\Huge` `\footnotesize` `\sixptsize`, and `≙` `≚` `≛` `≝` `≞` `≟` |
| `smash` | 1 | `\smash` |
| `tag` | 3 | `\tag` `\tag@paren` `\tag@literal` |
| `vcenter` | 1 | `\vcenter` |
| `verb` | 1 | `\verb` |
| `xArrow` | 2 | `\xrightequilibrium` `\xleftequilibrium` (mhchem; the other 20 work) |

Highest-value from this list, by how ordinary the command is: the
`\big`/`\Big` family, `\boxed`, `\operatorname`
and `\limsup`/`\argmax`, `\bmod`/`\pmod`, `\colon`, `\vdots`, `\phantom`,
`\textcolor`, `\xrightarrow`, `\middle`, and the `\tiny`…`\Huge` sizing
family. What is left is mostly presentational — colour, sizing, boxes and
phantoms — rather than notation.

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
drew filled polygons. The heads are `ArrowHead`'s open two-barb form — the
Computer Modern look — and `ArrowHead` grew a `barb: 'left' | 'right'` option
so the harpoons could keep one barb; `\rightharpoonup` and friends now match
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

### Math font commands (`font` node)

`TEX_FONT_FAMILY` in `math.ts:55` maps exactly one entry, `mathbb → KaTeX_AMS`.
Every other font command falls through with no family override:

`\mathrm` `\mathit` `\mathbf` `\mathnormal` `\mathsfit` `\mathcal` `\mathfrak`
`\mathscr` `\mathsf` `\mathtt` `\bold` `\frak` `\boldsymbol` `\bm`
`\rm` `\sf` `\tt` `\bf` `\it` `\cal`

So `\mathrm{x}` stays italic, `\mathcal{X}` stays an upright roman X, and
`\mathbf{x}` is not bold.

### Text font commands (`text` node)

`\textbf` `\textit` `\texttt` `\textsf` `\textrm` `\textnormal` `\textmd`
`\textup` `\emph` — all identical to plain `\text`.

**Root cause for both:** `MATH_FONTS` (`src/fonts/fonts.ts:119`) loads only
seven faces — `KaTeX_Math` (Italic), `KaTeX_Main` (Regular), `KaTeX_AMS`,
`KaTeX_Size1`–`Size4`. KaTeX ships and needs `Main-Bold`, `Main-Italic`,
`Main-BoldItalic`, `Math-BoldItalic`, `Caligraphic`, `Fraktur`, `SansSerif`,
`Script`, and `Typewriter` on top of those. Even wiring up
`TEX_FONT_FAMILY` cannot fix this until those faces are loaded.

### Not actually bugs

`\relax`, `\mathord` on an already-ord group, `\mathopen`/`\mathclose` around a
lone ord, and `\def`/`\let`/`\newcommand` (which correctly match their
expansion) also register as no-ops. `\cfrac`, `\over`, `\choose`, `\atop`,
`\brace`, `\brack`, and `\above` all verified correct in nested position.

## 4. Literal command leaks

The command name is drawn *as visible text* in `KaTeX_Math`, usually including
a notdef box for the backslash. 22 commands remain, down from 30.

The 8 stretchy over-accents that used to lead this list (`\overrightarrow` and
friends, which drew their own command name over the body) are fixed — see §2.1.
What remains is all text-mode.

**Text-mode accents** — the whole `\'` `` \` `` `\^` `\~` `\=` `\u` `\.` `\"`
`\c` `\r` `\H` `\v` set, plus `\textcircled`. `\text{\'e}` draws a notdef box,
an apostrophe, and `e`. KaTeX also emits a strict-mode warning for these.

**Text symbols** — `\aa` `\AA` `\copyright` `\textcopyright`
`\textregistered` `©` `®` leak their names. (`\ss`, `\o`, `\O`, `\ae`, `\oe`
are fine.)

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
- **Operators**: all 79 `op` entries except `\oiint`/`\oiiint`, including
  `\sum` `\prod` `\int` `\iint` `\oint` `\bigcup` `\bigoplus`, all the named
  functions (`\sin` `\log` `\det` `\lim` …), and `\limits`/`\nolimits`.
- **Fractions**: `\frac` `\dfrac` `\tfrac` `\cfrac` `\binom` `\dbinom`
  `\tbinom` `\genfrac`, and the infix forms `\over` `\atop` `\above`
  `\choose` `\brace` `\brack`.
- **Scripts**: `\sup`/`\sub` at every nesting depth, limit vs. side placement,
  `\overset` `\underset` `\stackrel`.
- **Delimiters**: `\left`…`\right` with auto-sizing and `\left.`/`\right.`.
- **Radicals**: `\sqrt`, `\sqrt[n]{}`.
- **Rules/lines**: `\overline` `\underline`.
- **Spacing**: `\,` `\:` `\;` `\!` `\quad` `\qquad` `\thinspace` `\enspace`
  `\negthinspace` `\kern` `\mkern` `\hskip` `\mskip` `\hspace` `\nobreak`.
- **Styles**: `\displaystyle` `\textstyle` `\scriptstyle` `\scriptscriptstyle`,
  and correct cramped-style propagation.
- **Classes**: `\mathbin` `\mathrel` `\mathpunct` `\mathinner` with correct
  inter-atom spacing, and `\mathllap`/`\mathrlap`/`\mathclap`.
- **Macros**: `\def` `\gdef` `\edef` `\let` `\newcommand` `\renewcommand`
  `\providecommand` `\char` `\@char` `\bgroup`/`\egroup`.
- **Text mode**: `\text{…}`, nested `$…$` inside `\text`.

## 9. Test files

All 26 live in `test/code/`, one feature per file, matching the existing
convention. Under strict mode (§7) the 11 remaining gap files **fail**
`bun scripts/test.ts` and the 15 regression files pass — 105 passed, 11 failed
across the whole corpus, with no false positives in `docs/` or `gala/`. Each
failing card still renders in `--report`, with the `StrictError` above the
picture, so you can see both the diagnosis and the damage. Rows in the gap
files keep surviving anchor terms (`1 + … + 2`) so a dropped construct reads as
a hole rather than a blank card.

**Gaps that should render but do not** — these will look wrong until the
feature lands, which is the point:

| file | covers |
| --- | --- |
| `math_delim_sizing.jsx` | `\big` `\Big` `\bigg` `\Bigg`, `l`/`r`/`m` variants, `\middle` |
| `math_enclose.jsx` | `\boxed` `\fbox` `\cancel` `\sout` |
| `math_phantom.jsx` | `\phantom` `\hphantom` `\vphantom` `\mathstrut` `\smash` |
| `math_sizing.jsx` | `\tiny` … `\Huge` |
| `math_color.jsx` | `\color` `\textcolor` |
| `math_rule_verb.jsx` | `\rule` `\vdots` `\verb` `\raisebox` `\TeX` |

**Gaps that fail silently** — highest priority, since nothing today flags them:

| file | covers |
| --- | --- |
| `math_font_families.jsx` | `\mathrm` `\mathbf` `\mathit` `\mathcal` `\mathfrak` `\mathscr` `\mathsf` `\mathtt` side by side with plain — currently all identical |
| `math_text_styles.jsx` | `\textbf` `\textit` `\texttt` `\textsf` vs `\text` |
| `math_text_accents.jsx` | `\'e` `` \`a `` `\^o` `\~n` `\"u` `\c c` `\v s` |
| `math_blackboard.jsx` | `\mathbb` upper vs lower vs digits |
| `math_glyph_gaps.jsx` | `\oiint` `\oiiint` `\origof` `\imageof`, text `þÐ` |

**Regression coverage for what already works** (the existing `math_*.jsx` files
cover symbols, sup/sub, fractions, sqrt, brackets, accents, ops, spacing,
styles, over/underline, negations, and parse errors):

| file | covers |
| --- | --- |
| `math_stretchy_accents.jsx` | `\overrightarrow` `\overleftrightarrow` `\overgroup` `\overlinesegment`, glyph accents |
| `math_accent_under.jsx` | `\underrightarrow` `\underleftrightarrow` `\undergroup` `\utilde` |
| `math_ext_arrows.jsx` | `\xrightarrow` `\xmapsto` `\xhookrightarrow` `\xrightleftharpoons`, labels above and below |
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
