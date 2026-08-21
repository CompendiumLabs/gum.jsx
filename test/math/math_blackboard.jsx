// SILENT GAP: \mathbb maps to KaTeX_AMS, which carries blackboard capitals
// only -- lowercase letters fall back to ordinary AMS glyphs and digits have
// no glyph at all, so \mathbb{1} draws a notdef box
<VStack spacing={0.1}>
  <Latex>{"\\mathbb{R} \\mathbb{N} \\mathbb{Z} \\mathbb{Q} \\mathbb{C} \\mathbb{H}"}</Latex>
  <Latex>{"\\mathbb{a} \\mathbb{b} \\mathbb{c} \\quad \\Bbb{x} \\Bbb{y}"}</Latex>
  <Latex>{"\\mathbb{0} \\mathbb{1} \\mathbb{2} \\quad 012"}</Latex>
</VStack>
