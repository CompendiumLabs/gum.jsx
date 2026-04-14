// load a CSV file and plot each row as a point
return <Graph xlim={[0, 10]} ylim={[0, 10]}>
  {loadTable('data.csv').map(({ x, y }) =>
    <Dot pos={[x, y]} rad={0.1} fill={blue} />
  )}
</Graph>
