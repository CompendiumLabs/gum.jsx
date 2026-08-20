// SILENT GAP: these codepoints are absent from the face gum resolves them to,
// so each draws a notdef box; the last row is the working neighbours
<VStack spacing={0.1}>
  <Latex>{"\\oiint \\quad \\oiiint"}</Latex>
  <Latex>{"\\origof \\quad \\imageof"}</Latex>
  <Latex>{"\\text{þ Þ ð Ð}"}</Latex>
  <Latex>{"\\int \\quad \\iint \\quad \\iiint \\quad \\oint"}</Latex>
</VStack>
