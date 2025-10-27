// A circle with an oscilating radius. The circle has a solid black border and is filled in with blue. The result should look like a splat.
const [freq, amp] = [5, 0.25]
const famp = t => 1 + amp * sin(freq * t)
const fx = t => famp(t) * cos(t)
const fy = t => famp(t) * sin(t)
return <Frame rounded fill>
  <Graph xlim={[-1.5, 1.5]} ylim={[-1.5, 1.5]}>
    <DataPoly fx={fx} fy={fy} tlim={[0, 2*pi]} N={500} fill={blue} opacity={0.75} />
  </Graph>
</Frame>
