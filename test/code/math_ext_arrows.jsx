// extensible arrows stretch to fit their labels, which ride at script size:
// the one above hangs from its baseline, the optional one below from its top
<VStack spacing={0.1}>
  <Latex>{"A \\xrightarrow{f} B \\xleftarrow{g} C \\xleftrightarrow{h} D"}</Latex>
  <Latex>{"X \\xrightarrow[\\text{below}]{\\text{above}} Y \\xRightarrow{k} Z \\xLeftarrow{m} W"}</Latex>
  <Latex>{"P \\xhookrightarrow{a} Q \\xhookleftarrow{b} R \\xmapsto{c} S \\xlongequal{d} T"}</Latex>
  <Latex>{"E \\xtwoheadrightarrow{n} F \\xrightleftharpoons{p} G \\xrightleftarrows{q} H"}</Latex>
</VStack>
