const xlim = [ -4, 4 ]; const ylim = [ -2, 2 ]
const Curve = ({ fx, stroke }) => <SymLine fx={fx} ylim={ylim} stroke={stroke} stroke-width={2} N={250} />
const xlabel = <Latex>x = a + bi</Latex>
const ylabel = <Latex>c</Latex>
return <Plot aspect={2} margin={0.3} xlim={xlim} ylabel={ylabel} xlabel={xlabel} ylabel-offset={0.075} ylabel-size={0.02}>
  <Mesh2D xlocs={41} ylocs={21} xlim={xlim} ylim={ylim} opacity={0.3} />
  <HLine loc={0} lim={xlim} opacity={0.3} />
  <VLine loc={0} lim={ylim} opacity={0.3} />
  <Curve fx={y => -y + sqrt(maximum(0, y*y-1))} stroke={blue} />
  <Curve fx={y => -y - sqrt(maximum(0, y*y-1))} stroke={blue} />
  <Curve fx={y => +sqrt(maximum(0, 1-y*y))} stroke={red} />
  <Curve fx={y => -sqrt(maximum(0, 1-y*y))} stroke={red} />
  <Dot pos={[-1, 1]} rad={0.04} color={blue} />
  <Dot pos={[1, -1]} rad={0.04} color={blue} />
  <Dot pos={[0, -1]} rad={0.04} color={red} />
  <Dot pos={[0, +1]} rad={0.04} color={red} />
  <Dot pos={[0, 0]} rad={0.04} />
  <Text color={blue} pos={[-2.5, 1.1]} yrad={0.2}>real</Text>
  <Text color={red} pos={[1.6, -0.4]} yrad={0.2}>imag</Text>
  <Latex pos={[2.3, 1.6]} yrad={0.2}>f(x) = x^2 + 2cx + 1</Latex>
</Plot>
