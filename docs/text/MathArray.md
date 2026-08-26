# MathArray

*Inherits*: [Group](/docs/Group) > [Element](/docs/Element)

Lays out math cells in rows and columns, following LaTeX's `array` metrics: every row gets a strut so short rows still take a full line, columns are as wide as their widest cell and separated by `\arraycolsep`, and the whole array is centered on the math axis. This is what [Latex](/docs/Latex) builds for every tabular environment, from `matrix` and `pmatrix` through `cases`, `aligned` and `array`, with `\hline`/`\hdashline` and the `|`/`:` column separators.

From JSX the cells can be given as a flat list plus `ncol`, which is reshaped into rows the way [Grid](/docs/Grid) does (nested arrays in JSX children are flattened), or as a list of rows. Each cell is a LaTeX string (parsed in `style`) or a math element. The array has no delimiters of its own; wrap it in a [Bracket](/docs/Bracket) for a `pmatrix` or `bmatrix`, which stretches its delimiters to the array's height.

Parameters:
- `children` — the cells, either a flat list chunked by `ncol` or a list of rows
- `style` = `text` — the TeX style string cells are parsed in
- `ncol` — the number of columns to chunk a flat list of cells into; defaults to the number of aligned columns in `cols`, else `1`
- `cols` — the column descriptors, in order, as objects: `{ type: 'align', align: 'l' | 'c' | 'r' }` for a column (with optional `pregap`/`postgap` in em) and `{ type: 'separator', separator: '|' | ':' }` for a solid or dashed rule between columns. Columns beyond the descriptors are centered
- `stretch` = `1` — the row spacing multiplier, LaTeX's `\arraystretch`
- `jot` = `false` — add `\jot` of extra leading between rows, as the AMS `aligned`/`gathered` environments do
- `colsep` = `0.5` — the space on either side of each column in em, LaTeX's `\arraycolsep`
- `outer` = `false` — whether to pad the outer edges by `colsep` as well
- `hlines` — a list with one entry per row boundary (before the first row through after the last), each a list of rules to draw there, `true` for dashed and `false` for solid
- `rowgaps` — extra depth to add after each row in em, like `\\[len]`
- `thickness` = `0.04` — the thickness of the rules in em
- `fill` — the colour of the rules (`color` is accepted as an alias)
