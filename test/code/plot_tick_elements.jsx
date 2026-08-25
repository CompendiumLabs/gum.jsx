// tick labels may be elements as well as strings and numbers: a [loc, label]
// pair takes any element (math, styled text) and places it upright like a Span
<Plot aspect={2} margin={0.15} xlim={[0, 10]} ylim={[0, 10]}
  xticks={[[2, <Latex>10^2</Latex>], [5, <Latex>10^5</Latex>], [8, "eight"], 9.5]}
  yticks={[[2, <Latex>{"\\frac{1}{2}"}</Latex>], [5, <Text color={red}>five</Text>], 8]}>
  <SymLine fy={x => x} stroke={blue} />
</Plot>
