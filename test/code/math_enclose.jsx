// `enclose` nodes draw a box or strike through their body; unsupported, so the
// whole construct (frame and body alike) drops out between the anchor terms
<VStack spacing={0.1}>
  <Latex>{"E = \\boxed{mc^2} + 1 \\quad a \\fbox{x} b"}</Latex>
  <Latex>{"1 + \\cancel{a} + \\bcancel{b} + \\xcancel{c} + 2"}</Latex>
  <Latex>{"p \\sout{d} q \\quad r \\phase{30} s"}</Latex>
</VStack>
