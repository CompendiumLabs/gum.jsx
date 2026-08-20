// under-accents (`accentUnder`) mirror the stretchy over-accents but are a
// distinct node type; unsupported, so base and decoration both disappear
<VStack spacing={0.1}>
  <Latex>{"1 + \\underrightarrow{AB} + \\underleftarrow{CD} + 2"}</Latex>
  <Latex>{"1 + \\underleftrightarrow{xy} + \\undergroup{zw} + 2"}</Latex>
  <Latex>{"1 + \\underlinesegment{pq} + \\utilde{r} + 2"}</Latex>
  <Latex>{"1 + \\underline{AB} + \\overline{CD} + 2"}</Latex>
</VStack>
