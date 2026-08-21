// manual delimiter sizing (`delimsizing` node) is unsupported, so the fences
// disappear while the bodies stay; \left...\right on the last row still works
<VStack spacing={0.1}>
  <Latex>{"\\big( x \\big) \\Big( x \\Big) \\bigg( x \\bigg) \\Bigg( x \\Bigg)"}</Latex>
  <Latex>{"\\bigl[ a \\bigr] \\Bigl\\{ b \\Bigr\\} \\biggl\\langle c \\biggr\\rangle"}</Latex>
  <Latex>{"a \\bigm| b \\quad \\left( a \\middle| b \\right)"}</Latex>
  <Latex>{"\\left( \\frac{1}{2} \\right) \\left[ \\sum_i a_i \\right]"}</Latex>
</VStack>
