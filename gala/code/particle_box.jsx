// Quantum Eigenfunctions: Particle in a 1D Box
// Old textbook style — black and white

const nLevels = [1, 2, 3, 4]
const amp = 0.75
const sp = 2.5
const ymin = -0.5
const ymax = nLevels.length * sp + 0.5

return <Box padding>
  <VStack spacing={0.1}>
    <Text stack-size={0.075}>Particle in a Box</Text>
    <Plot
      aspect={1.5}
      margin={[0, 0, 0, 0.075]}
      xlim={[-0.5, 1.5]}
      ylim={[ymin, ymax]}
      xticks={[[0, "0"], [0.5, "L/2"], [1, "L"]]}
      xaxis-stroke-width={1.5}
      xaxis-tick-side="outer"
      yaxis={false}
    >
      {/* Hatching on outside of walls */}
      {linspace(ymin, ymax - 0.5, 18).map(y =>
        <Line points={[[-0.1, y], [0, y + 0.5]]} stroke-width={0.6} />
      )}
      {linspace(ymin, ymax - 0.5, 18).map(y =>
        <Line points={[[1, y], [1.1, y + 0.5]]} stroke-width={0.6} />
      )}

      {/* Thick box walls */}
      <VLine loc={0} lim={[ymin, ymax]} stroke-width={2} />
      <VLine loc={1} lim={[ymin, ymax]} stroke-width={2} />

      {/* Eigenfunctions */}
      {nLevels.map((n, i) =>
        <HLine loc={(i + 0.5) * sp} lim={[0, 1]} stroke-opacity={0.3}/>
      )}
      {nLevels.map((n, i) =>
        <SymSpline fy={x => ((i + 0.5) * sp) + amp * sin(n * pi * x)} xlim={[0, 1]} stroke-width={2} />
      )}

      {/* n labels to the left */}
      {nLevels.map((n, i) =>
        <Tex pos={[-0.3, (i + 0.5) * sp]} ysize={0.75}>{`n=${n}`}</Tex>
      )}

      {/* E_n labels to the right */}
      {nLevels.map((n, i) =>
        <Tex pos={[1.25, (i + 0.5) * sp]} ysize={0.75}>{`E_{${n}}`}</Tex>
      )}
    </Plot>
    <Tex stack-size={0.075}>{"\\psi_n(x) = \\sqrt{2/L}\\;\\sin(n\\pi x / L)"}</Tex>
  </VStack>
</Box>
