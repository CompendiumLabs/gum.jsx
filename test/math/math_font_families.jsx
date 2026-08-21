// SILENT GAP: TEX_FONT_FAMILY (math.ts) maps only `mathbb`, and MATH_FONTS
// loads neither the bold/italic Main faces nor Caligraphic/Fraktur/SansSerif/
// Typewriter -- so every row below is byte-identical to the plain baseline
<VStack spacing={0.1}>
  <Latex>{"Rx \\quad \\mathrm{Rx} \\quad \\mathnormal{Rx} \\quad \\mathit{Rx}"}</Latex>
  <Latex>{"\\mathbf{Rx} \\quad \\bold{Rx} \\quad \\boldsymbol{Rx} \\quad \\bm{Rx}"}</Latex>
  <Latex>{"\\mathcal{Rx} \\quad \\mathfrak{Rx} \\quad \\mathscr{Rx} \\quad \\frak{Rx}"}</Latex>
  <Latex>{"\\mathsf{Rx} \\quad \\mathsfit{Rx} \\quad \\mathtt{Rx} \\quad \\mathbb{RX}"}</Latex>
  <Latex>{"{\\rm Rx} \\quad {\\bf Rx} \\quad {\\it Rx} \\quad {\\tt Rx} \\quad {\\cal Rx}"}</Latex>
</VStack>
