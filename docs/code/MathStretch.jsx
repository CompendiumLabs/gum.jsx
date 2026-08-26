// standalone decorations as math items: a long arrow between two expressions,
// a double-headed arrow, and a brace
<MathCol spacing={0.3}>
  <MathText>
    <MathSymbol>f</MathSymbol>
    <MathStretch label="xrightarrow" advance={2} />
    <MathSymbol>g</MathSymbol>
    <MathStretch label="xLeftrightarrow" advance={1.5} fill={blue} />
    <MathSymbol>h</MathSymbol>
  </MathText>
  <MathStretch label="overbrace" advance={3} fill={red} />
</MathCol>
