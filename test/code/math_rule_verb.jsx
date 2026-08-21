// a grab bag of unsupported leaf nodes: rules (and \vdots, which is built from
// one), verbatim text, raised boxes, and the \TeX/\LaTeX logos
<VStack spacing={0.1}>
  <Latex>{"a \\rule{2em}{0.5em} b \\quad \\vdots \\quad \\ddots"}</Latex>
  <Latex>{"\\verb|x + y| \\quad \\raisebox{0.5em}{high} \\quad low"}</Latex>
  <Latex>{"\\TeX \\quad \\LaTeX \\quad \\KaTeX \\quad \\dddot{x}"}</Latex>
</VStack>
