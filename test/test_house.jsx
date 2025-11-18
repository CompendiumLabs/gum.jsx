<TitleFrame margin rounded border={2} fill clip title="Little House" title-size={0.08}>
  <Group aspect={2}>
    {/* Sky background */}
    <Rect fill={"#eaf6ff"} />

    {/* Sun */}
    <Circle pos={[0.88, 0.12]} rad={0.1} fill={"#ffd166"} fill-opacity={0.35} stroke={none} />
    <Circle pos={[0.88, 0.12]} rad={0.06} fill={"#ffcd3c"} stroke={"#e0a800"} />

    {/* House base */}
    <Rect pos={[0.5, 0.65]} rad={[0.25, 0.2]} fill={"#ffe8cc"} stroke={"#6b4e3d"} />

    {/* Chimney: align base to roof slope at x=0.65 (y = x - 0.3 => 0.35) */}
    <Rect pos={[0.65, 0.3]} rad={[0.03, 0.13]} fill={"#a0522d"} stroke={"#6b4e3d"} />

    {/* Roof */}
    <Polygon fill={"#d1495b"} stroke={"#6b4e3d"}>{[
      [0.25, 0.45],
      [0.75, 0.45],
      [0.5, 0.2],
    ]}</Polygon>

    {/* Door: align bottom to base/ground at y=0.85 (center 0.85 - 0.12 = 0.73) */}
    <Rect pos={[0.5, 0.73]} rad={[0.04, 0.12]} fill={'#b5651d'} stroke={"#6b4e3d"} />
    <Circle pos={[0.53, 0.73]} rad={0.01} fill={"#f2c94c"} stroke={"#6b4e3d"} />

    {/* Windows */}
    <Square pos={[0.37, 0.62]} rad={0.06} fill={"#cfe9ff"} stroke={"#2c3e50"} />
    <HLine pos={[0.37, 0.62]} rad={0.03} stroke={"#2c3e50"} stroke-opacity={0.7} />
    <VLine pos={[0.37, 0.62]} rad={0.06} stroke={"#2c3e50"} stroke-opacity={0.7} />
    <Square pos={[0.63, 0.62]} rad={0.06} fill={"#cfe9ff"} stroke={"#2c3e50"} />
    <HLine pos={[0.63, 0.62]} rad={0.03} stroke={"#2c3e50"} stroke-opacity={0.7} />
    <VLine pos={[0.63, 0.62]} rad={0.06} stroke={"#2c3e50"} stroke-opacity={0.7} />

    {/* Ground / Grass */}
    <Rect pos={[0.5, 0.925]} rad={[0.5, 0.075]} fill={green} />

    {/* Trunk (extended upward to meet canopy; still anchored to ground at y=0.85) */}
    <Rect pos={[0.18, 0.605]} rad={[0.018, 0.245]} fill={"#8b5a2b"} stroke={"#6b4e3d"} />

    {/* Foliage (symmetrized clover: equal radii; left/right mirrored around trunk) */}
    <Circle pos={[0.18, 0.28]} rad={0.10} fill={"#2ecc71"} stroke={"#2c3e50"} />
    <Circle pos={[0.12, 0.34]} rad={0.10} fill={"#27ae60"} stroke={"#2c3e50"} />
    <Circle pos={[0.24, 0.34]} rad={0.10} fill={"#27ae60"} stroke={"#2c3e50"} />
  </Group>
</TitleFrame>
