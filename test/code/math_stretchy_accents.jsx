// SILENT GAP: stretchy accents have no single glyph, so Accent falls through
// and draws the command name as literal text (with a notdef box for the
// backslash); the glyph-backed accents on the last row are correct
<VStack spacing={0.1}>
  <Latex>{"\\overrightarrow{AB} \\quad \\overleftarrow{CD}"}</Latex>
  <Latex>{"\\overleftrightarrow{xy} \\quad \\Overrightarrow{PQ}"}</Latex>
  <Latex>{"\\overgroup{ab} \\quad \\overlinesegment{cd}"}</Latex>
  <Latex>{"\\overleftharpoon{ef} \\quad \\overrightharpoon{gh}"}</Latex>
  <Latex>{"\\widehat{AB} \\quad \\widetilde{CD} \\quad \\widecheck{EF} \\quad \\vec{v}"}</Latex>
</VStack>
