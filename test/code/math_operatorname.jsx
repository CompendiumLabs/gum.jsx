// \operatorname and everything built on it (limsup, argmax, the modulo family,
// \colon) parse to `operatorname`/`mathchoice` nodes and render as nothing
<VStack spacing={0.1}>
  <Latex>{"\\operatorname{sn}(x) + \\operatorname*{lim}_{n} y"}</Latex>
  <Latex>{"\\limsup_{n} a_n = \\liminf_{n} b_n \\quad \\argmax_x f(x)"}</Latex>
  <Latex>{"a \\bmod b \\quad a \\equiv b \\pmod{n} \\quad c \\mod d"}</Latex>
  <Latex>{"f \\colon A \\to B \\quad \\sin x + \\log y"}</Latex>
</VStack>
