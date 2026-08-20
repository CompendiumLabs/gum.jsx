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

Totals over 2856 probes: 2371 ok, 215 unsupported, 63 parse-error,
24 no-op, 30 literal-leak, 14 missing-glyph, 44 blank/warn.

**Version note.** gum parses with katex 0.16.33 (`node_modules`), while the
inventory came from the 0.18.4 checkout. Only three names differ:
`\overbracket`, `\underbracket`, and text-mode `·` (U+00B7) exist in 0.18.4 but
not 0.16.33, so they parse-error rather than being gum gaps.

---

## 1. Parse-node coverage

KaTeX defines 57 parse-node types. `convert_tree` handles 20:

`mathord` `textord` `atom` `ordgroup` `op` `text` `font` `accent` `kern`
`spacing` `mclass` `lap` `htmlmathml` `styling` `supsub` `genfrac`
`underline` `overline` `sqrt` `leftright`

Nine more never reach the converter (the parser resolves them internally):
`infix` → `genfrac`, plus `internal` `raw` `size` `url` `color-token`
`accent-token` `op-token` `environment` `leftright-right`.

That leaves **25 node types that reach `convert_tree` and hit the fallback**,
where the element is dropped and replaced by an empty spacer.

## 2. Unsupported node types

Everything here renders as *nothing* (silently — only a `console.error`).

| node type | n | commands |
| --- | --- | --- |
| `accentUnder` | 6 | `\underleftarrow` `\underrightarrow` `\underleftrightarrow` `\undergroup` `\underlinesegment` `\utilde` |
| `array` | 3 | `\substack` `\hline` `\hdashline` |
| `color` | 64 | `\textcolor` `\color` `\href` `\url` `\htmlClass` `\htmlId` `\htmlStyle` `\includegraphics`, plus the 56 Khan-Academy palette macros (`\blue` `\red` `\greenA` `\kaBlue` …) |
| `cr` | 2 | `\\` `\newline` |
| `delimsizing` | 16 | `\big` `\Big` `\bigg` `\Bigg` and the `l`/`r`/`m` variants |
| `enclose` | 11 | `\boxed` `\fbox` `\colorbox` `\fcolorbox` `\cancel` `\bcancel` `\xcancel` `\sout` `\phase` `\angl` `\angln` |
| `hbox` | 1 | `\hbox` |
| `horizBrace` | 2 | `\overbrace` `\underbrace` |
| `mathchoice` | 8 | `\mathchoice` `\colon` `\bmod` `\pmod` `\mod` `\pod` `\minuso` `⦵` |
| `middle` | 1 | `\middle` |
| `operatorname` | 13 | `\operatorname` `\operatornamewithlimits` `\limsup` `\liminf` `\injlim` `\projlim` `\varlimsup` `\varliminf` `\varinjlim` `\varprojlim` `\argmin` `\argmax` |
| `phantom` `hphantom` `vphantom` | 4 | `\phantom` `\hphantom` `\vphantom` `\mathstrut` |
| `pmb` | 1 | `\pmb` |
| `raisebox` | 7 | `\raisebox` `\dddot` `\ddddot` `\TeX` `\LaTeX` `\KaTeX` `≘` |
| `rule` | 3 | `\rule` `\vdots` `⋮` |
| `sizing` | 17 | `\tiny` `\scriptsize` `\small` `\normalsize` `\large` `\Large` `\LARGE` `\huge` `\Huge` `\footnotesize` `\sixptsize`, and `≙` `≚` `≛` `≝` `≞` `≟` |
| `smash` | 1 | `\smash` |
| `vcenter` | 1 | `\vcenter` |
| `verb` | 1 | `\verb` |
| `xArrow` | 22 | `\xrightarrow` `\xleftarrow` `\xRightarrow` `\xLeftarrow` `\xleftrightarrow` `\xmapsto` `\xlongequal` `\xhookrightarrow` `\xrightleftharpoons` … |

Highest-value from this list, by how ordinary the command is: `\\` (line
break), `\big`/`\Big` family, `\overbrace`/`\underbrace`, `\boxed`,
`\operatorname` and `\limsup`/`\argmax`, `\bmod`/`\pmod`, `\colon`,
`\vdots`, `\substack`, `\phantom`, `\textcolor`, `\xrightarrow`, `\middle`,
and the `\tiny`…`\Huge` sizing family.

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
a notdef box for the backslash.

**Stretchy accents** — the `accent` node is handled, but only for accents with
a single glyph. The stretchy ones have no glyph and leak:

`\overrightarrow` `\overleftarrow` `\Overrightarrow` `\overleftrightarrow`
`\overgroup` `\overlinesegment` `\overleftharpoon` `\overrightharpoon`

`\overrightarrow{AB}` literally renders the string `\overrightarrow` followed
by `AB`. (`\widehat`, `\widetilde`, `\hat`, `\vec`, `\bar`, `\dot`, `\ddot`,
`\tilde`, `\acute`, `\grave`, `\check`, `\breve`, `\mathring`, `\widecheck`
are all fine.)

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

All 33 fail. 21 reach `convert_tree` as an unhandled `array` node and vanish:

`array` `darray` `matrix` `pmatrix` `bmatrix` `Bmatrix` `vmatrix` `Vmatrix`
(and the six `*` starred variants) `smallmatrix` `cases` `dcases` `rcases`
`drcases` `aligned` `gathered`

The other 12 are rejected by the parser itself in non-display mode and fall
back to red literal text: `align` `align*` `alignat` `alignat*` `alignedat`
`gather` `gather*` `split` `equation` `equation*` `subarray` `CD`.

Adding one `array` node handler covers matrices, `cases`, `aligned`,
`gathered`, `substack`, `\\`, and `\hline` in one pass — the single largest
win available.

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

All 23 are written and live in `test/code/`, one feature per file, matching the
existing convention. Under strict mode (§7) the 18 gap files **fail**
`bun scripts/test.ts` and the 5 regression files pass — 95 passed, 18 failed
across the whole corpus, with no false positives in `docs/` or `gala/`. Each
failing card still renders in `--report`, with the `StrictError` above the
picture, so you can see both the diagnosis and the damage. Rows in the gap
files keep surviving anchor terms (`1 + … + 2`) so a dropped construct reads as
a hole rather than a blank card.

**Gaps that should render but do not** — these will look wrong until the
feature lands, which is the point:

| file | covers |
| --- | --- |
| `math_array_matrix.jsx` | `pmatrix` `bmatrix` `vmatrix` `smallmatrix` |
| `math_array_cases.jsx` | `cases` `aligned` `gathered` `substack` |
| `math_delim_sizing.jsx` | `\big` `\Big` `\bigg` `\Bigg`, `l`/`r`/`m` variants, `\middle` |
| `math_horiz_brace.jsx` | `\overbrace` `\underbrace` with scripts |
| `math_ext_arrows.jsx` | `\xrightarrow` `\xleftarrow` `\xmapsto` with over/under labels |
| `math_operatorname.jsx` | `\operatorname` `\limsup` `\argmax` `\bmod` `\pmod` `\colon` |
| `math_enclose.jsx` | `\boxed` `\fbox` `\cancel` `\sout` |
| `math_phantom.jsx` | `\phantom` `\hphantom` `\vphantom` `\mathstrut` `\smash` |
| `math_sizing.jsx` | `\tiny` … `\Huge` |
| `math_color.jsx` | `\color` `\textcolor` |
| `math_accent_under.jsx` | `\underrightarrow` `\undergroup` `\utilde` |
| `math_rule_verb.jsx` | `\rule` `\vdots` `\verb` `\raisebox` `\TeX` |

**Gaps that fail silently** — highest priority, since nothing today flags them:

| file | covers |
| --- | --- |
| `math_font_families.jsx` | `\mathrm` `\mathbf` `\mathit` `\mathcal` `\mathfrak` `\mathscr` `\mathsf` `\mathtt` side by side with plain — currently all identical |
| `math_text_styles.jsx` | `\textbf` `\textit` `\texttt` `\textsf` vs `\text` |
| `math_stretchy_accents.jsx` | `\overrightarrow` `\overleftarrow` `\overgroup` — currently leak their names |
| `math_text_accents.jsx` | `\'e` `` \`a `` `\^o` `\~n` `\"u` `\c c` `\v s` |
| `math_blackboard.jsx` | `\mathbb` upper vs lower vs digits |
| `math_glyph_gaps.jsx` | `\oiint` `\oiiint` `\origof` `\imageof`, text `þÐ` |

**Regression coverage for what already works** (the existing `math_*.jsx` files
cover symbols, sup/sub, fractions, sqrt, brackets, accents, ops, spacing,
styles, over/underline, negations, and parse errors):

| file | covers |
| --- | --- |
| `math_symbol_sweep.jsx` | a dense grid of the 453 named math symbols that render today (of 459 total), to catch font-table regressions |
| `math_infix_frac.jsx` | `\over` `\atop` `\above` `\choose` `\brace` `\brack` |
| `math_macros.jsx` | `\def` `\newcommand` `\let` `\char` |
| `math_lap.jsx` | `\mathllap` `\mathrlap` `\mathclap` |
| `math_class_spacing.jsx` | `\mathbin` `\mathrel` `\mathpunct` `\mathinner` spacing |
