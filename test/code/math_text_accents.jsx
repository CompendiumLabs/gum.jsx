// SILENT GAP: text-mode accents leak their command name into the output as
// literal text; katex also flags these under strict mode
<VStack spacing={0.1}>
  <Latex>{"\\text{\\'e \\`a \\^o \\~n \\\"u}"}</Latex>
  <Latex>{"\\text{\\=o \\.o \\u{o} \\v{s} \\c{c}}"}</Latex>
  <Latex>{"\\text{\\r{a} \\H{o} \\textcircled{a}}"}</Latex>
  <Latex>{"\\text{\\ss \\o \\O \\ae \\oe \\AE \\OE \\i \\j}"}</Latex>
</VStack>
