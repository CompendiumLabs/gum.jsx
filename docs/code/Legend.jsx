// two curves with a legend in the corner: a solid blue line, a dashed red
// line, and a green dot as the badge for a set of points
<Plot aspect={2} xlim={[0, 2*pi]} ylim={[-1.2, 1.2]} margin={0.15}>
  <SymLine fy={sin} stroke={blue} stroke-width={2} />
  <SymLine fy={cos} stroke={red} stroke-width={2} stroke-dasharray={5} />
  <SymPoints fy={x => 0.5*sin(2*x)} N={12} fill={green} point-size={0.05} />
  <Legend pos={[5.2, 0.85]} ysize={0.7} vspacing={0.15}>
    {[
      { stroke: blue, stroke_width: 2, label: 'sine' },
      { stroke: red, stroke_width: 2, stroke_dasharray: 5, label: 'cosine' },
      <Box padding={0.2} label="samples"><Dot fill={green} /></Box>,
    ]}
  </Legend>
</Plot>
