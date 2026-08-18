// axis arrowheads: a Plot with arrows on the right and top ends (styled per side and globally), plus standalone axes with arrows on both ends
<HStack spacing={0.1}>
  <Plot aspect={phi} margin={0.15} xlim={[0, 4]} ylim={[0, 1]} xticks={[0, 1, 2, 3]} yticks={[0, 0.25, 0.5, 0.75]} axis-arrow-right axis-arrow-top axis-arrow-fill={blue} yaxis-arrow-top-fill={red} xaxis-arrow-size={3}>
    <SymLine fy={x => sqrt(x) / 2} xlim={[0, 4]} />
  </Plot>
  <Box padding={[0.5, 1]}><HAxis aspect={8} ticks={[0.25, 0.5, 0.75]} label-size={0.6} arrow-left arrow-right /></Box>
  <Box padding={[1, 0.5]}><VAxis aspect={1/8} ticks={[0.25, 0.5, 0.75]} label-size={0.6} arrow-top arrow-bottom arrow-fill={blue} /></Box>
</HStack>
