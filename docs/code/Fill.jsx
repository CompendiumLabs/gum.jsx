// shade the area between a zigzag curve and the x-axis
const curve = [[0, 1], [2, 3], [4, 2], [6, 5], [8, 4], [10, 6]]
return <Graph xlim={[0, 10]} ylim={[0, 7]} aspect={phi}>
  <VFill points1={curve} points2={0} fill={blue} fill-opacity={0.4} />
  <Line points={curve} stroke={blue} />
</Graph>
