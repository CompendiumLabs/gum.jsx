// a 2x2 matrix in parentheses, and a right-aligned table with a rule between
// its rows and a dashed rule between its columns
return <MathText spacing={1}>
  <Bracket>
    <MathArray ncol={2}>{['a', 'b', 'c', 'd']}</MathArray>
  </Bracket>
  <MathArray
    cols={[{ type: 'align', align: 'r' }, { type: 'separator', separator: ':' }, { type: 'align', align: 'r' }]}
    hlines={[[], [false], []]}
  >
    {['x', '100', 'y^2', '5']}
  </MathArray>
</MathText>
