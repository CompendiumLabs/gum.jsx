// \color and \textcolor are `color` nodes: unsupported, so the colored body is
// dropped entirely rather than falling back to the default ink
<VStack spacing={0.1}>
  <Latex>{"a + {\\color{red} b + c} + d"}</Latex>
  <Latex>{"1 + \\textcolor{blue}{x^2} + \\textcolor{green}{y^2} = z^2"}</Latex>
  <Latex>{"1 + \\red{p} \\blue{q} \\green{r} + 2"}</Latex>
  <Latex>{"a + b + c + d"}</Latex>
</VStack>
