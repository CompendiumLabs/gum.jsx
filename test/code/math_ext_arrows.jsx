// extensible arrows (`xArrow`) stretch to fit an over/under label in katex;
// here the arrow and both labels vanish and the flanking terms close up
<VStack spacing={0.1}>
  <Latex>{"A \\xrightarrow{f} B \\xleftarrow{g} C"}</Latex>
  <Latex>{"X \\xrightarrow[\\text{below}]{\\text{above}} Y"}</Latex>
  <Latex>{"P \\xLeftarrow{h} Q \\xmapsto{k} R \\xlongequal{} S"}</Latex>
</VStack>
