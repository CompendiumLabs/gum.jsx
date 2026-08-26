// an overbrace with a label counting its terms, and an underbrace naming a tail
<MathText>
  <HorizBrace label={<MathSymbol>n</MathSymbol>}>{"a + b + c"}</HorizBrace>
  <MathSymbol>+</MathSymbol>
  <HorizBrace over={false} label={<MathText>{"\\text{tail}"}</MathText>} color={blue}>{"y + z"}</HorizBrace>
</MathText>
