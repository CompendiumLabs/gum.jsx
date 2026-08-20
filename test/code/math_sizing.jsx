// the \tiny...\Huge family scopes a size change over the rest of its group; the
// `sizing` node is unsupported, so each braced group vanishes between anchors
<VStack spacing={0.1}>
  <Latex>{"A {\\tiny t} B {\\scriptsize s} C {\\footnotesize f} D {\\small m} E"}</Latex>
  <Latex>{"A {\\normalsize n} B {\\large l} C {\\Large L} D {\\LARGE X} E"}</Latex>
  <Latex>{"A {\\huge h} B {\\Huge H} C \\quad A t B s C f D m E"}</Latex>
</VStack>
