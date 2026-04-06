// a scatter plot of points with emojis for: mount fuji, a rocket, a whale, a watermellon, and a donut
<Plot xlim={[0, 6]} ylim={[0, 6]} xticks={7} yticks={7} margin={0.15}>
  { [ '🗻', '🚀', '🐋', '🍉', '🍩' ].map((e, i) =>
    <Text pos={[i+1, i+1]} size={0.8}>{e}</Text>
  ) }
</Plot>
