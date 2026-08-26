// a faint grid under a sine curve, drawn in data coordinates, with a heavier
// vertical mesh at the multiples of pi
<Graph aspect={2} xlim={[0, 2*pi]} ylim={[-1, 1]}>
  <Mesh2D xlocs={13} ylocs={5} opacity={0.15} />
  <HMesh locs={[pi, 2*pi]} stroke={blue} stroke-dasharray={4} />
  <SymLine fy={sin} stroke={red} stroke-width={2} />
</Graph>
