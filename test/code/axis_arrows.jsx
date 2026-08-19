// axis arrowheads: a Plot of log(x) with arrows on the right and top ends
<Plot aspect={phi} margin={0.15} xlim={[1, 5]} ylim={[0, 2]} xticks={range(1, 5)} yticks={linspace(0, 1.5, 4)} grid xaxis-arrow-right yaxis-arrow-top>
  <SymLine fy={log} xlim={[1, 5]} />
</Plot>
