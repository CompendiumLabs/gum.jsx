// phantoms reserve space without ink; all three variants plus \mathstrut and
// \smash are unsupported, so the spacing they exist to create collapses
<VStack spacing={0.1}>
  <Latex>{"a \\phantom{XXXX} b \\quad a b"}</Latex>
  <Latex>{"a \\hphantom{XXXX} b \\quad a \\vphantom{\\frac{1}{2}} b"}</Latex>
  <Latex>{"a \\mathstrut b \\quad \\smash{\\frac{p}{q}} + r"}</Latex>
</VStack>
