// \overbrace and \underbrace are `horizBrace` nodes: the brace and its script
// label are dropped, leaving the braced body inline with the rest of the sum
<VStack spacing={0.1}>
  <Latex>{"\\overbrace{a + b + c}^{n \\text{ terms}} + d"}</Latex>
  <Latex>{"x + \\underbrace{y + z}_{\\text{tail}}"}</Latex>
  <Latex>{"\\overbrace{\\underbrace{p}_{q}}^{r}"}</Latex>
</VStack>
