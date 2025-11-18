const func1 = t => 4 * Math.pow(t, 3)
const func2 = t => 1 - func1(1 - t)
return <TitleFrame title="Cubic Easing" margin={0.2} border-stroke="#aaa">
  <Plot aspect grid ylim={[0, 1]} clip>
  <DataPath fy={func1} xlim={[0, 0.5]} stroke={blue} stroke-width={3} />
  <DataPath fy={func1} xlim={[0.5, 1]} stroke={blue} opacity={0.75} />
  <DataPath fy={func2} xlim={[0.5, 1]} stroke={red} stroke-width={3} />
  <DataPath fy={func2} xlim={[0, 0.5]} stroke={red} opacity={0.75} />
  <Dot pos={[0.5, 0.5]} rad={0.01} />
  <Legend pos={[0.75, 0.125]} yrad={0.09} padding={0.15} vflip>
    <HLine aspect stroke={blue} stroke-width={5} label={<Latex>4 t^3</Latex>} />
    <HLine aspect stroke={red} stroke-width={5} label={<Latex>1 - 4 (1-t)^3 </Latex>} />
  </Legend>
</Plot>
</TitleFrame>
