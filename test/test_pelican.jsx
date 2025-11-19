const orange = '#FFA500'
const yellow = '#FFD700'
const dark_gray = '#444444'

// Helper for the bike frame
const rear_axle = [-0.4, -0.3]
const front_axle = [0.4, -0.3]
const crank = [0, -0.3]
const seat_pos = [-0.15, 0.1]
const handle_pos = [0.3, 0.25]

return <TitleFrame aspect={1.5} margin={0.1} rounded clip title="Pelican Dude">
  <Group coord={[-1, 1, 1, -1]}>
  <Group rect={[0, 0, 1, 1]}>
    {/* --- BACKGROUND --- */}
    <Rect pos={[0, 0]} rad={[1, 1]} fill="#87CEEB" />
    <Rect pos={[0, -0.6]} rad={[1, 0.4]} fill="#90EE90" />

    {/* --- BICYCLE --- */}

    {/* Wheels */}
    <Group>
      <Circle pos={rear_axle} rad={0.22} stroke={dark_gray} stroke-width={4} fill={none} />
      <Circle pos={front_axle} rad={0.22} stroke={dark_gray} stroke-width={4} fill={none} />
      {/* Spokes */}
      {[0, 45, 90, 135].map(r =>
        <Group>
          <HLine pos={rear_axle} rad={0.14} spin={r} />
          <HLine pos={front_axle} rad={0.14} spin={r} />
        </Group>
      )}
    </Group>

    {/* Bike Frame Structure (Red) */}
    <Group stroke={red} stroke-width={3.5} stroke-linecap="round" stroke-linejoin="round">
      <Polyline>{[ rear_axle, seat_pos, crank, rear_axle ]}</Polyline>
      <Line pos1={seat_pos} pos2={[0.25, 0.1]} />
      <Line pos1={[0.25, 0.1]} pos2={crank} />
      <Line pos1={[0.25, 0.1]} pos2={front_axle} /> {/* Fork */}
      <Line pos1={[0.25, 0.1]} pos2={handle_pos} stroke={dark_gray} /> {/* Stem */}
      <Line pos1={[0.25, 0.25]} pos2={[0.35, 0.25]} stroke={dark_gray} /> {/* Handlebar */}
    </Group>

    {/* Seat */}
    <Ellipse pos={[-0.18, 0.12]} rad={[0.08, 0.025]} fill={dark_gray} />

    {/* --- PELICAN --- */}

    {/* Legs */}
    <Line pos1={[-0.1, 0.1]} pos2={crank} stroke={orange} stroke-width={4} />
    <Line pos1={[-0.05, 0.1]} pos2={[-0.1, -0.3]} stroke={orange} stroke-width={4} />

    {/* Tail Feathers */}
    <Polygon fill={white} stroke={black} stroke-width={1.5}>
      {[ [-0.24, 0.2], [-0.39, 0.25], [-0.24, 0.1] ]}
    </Polygon>

    {/* Body */}
    <Ellipse pos={[-0.1, 0.15]} rad={[0.16, 0.11]} fill={white} stroke={black} stroke-width={1.5} />

    {/* Neck (Connecting Body to Head) */}
    <Polygon fill={white} stroke={none}>
      {[ [-0.05, 0.2], [0.12, 0.35], [0.18, 0.3], [0, 0.1] ]}
    </Polygon>
    {/* Neck Outlines */}
    <Line pos1={[-0.05, 0.22]} pos2={[0.13, 0.37]} stroke={black} stroke-width={1.5} />
    <Line pos1={[0.02, 0.1]} pos2={[0.18, 0.3]} stroke={black} stroke-width={1.5} />

    {/* Head Area */}
    <Group>
      {/* The Pouch (Yellow/Orange bag) */}
      <Polygon fill={yellow} stroke={black} stroke-width={1.5}>
         {[ [0.18, 0.32], [0.25, 0.15], [0.45, 0.2], [0.55, 0.32] ]}
      </Polygon>

      {/* Upper Beak */}
      <Polygon fill={orange} stroke={black} stroke-width={1.5}>
         {[ [0.15, 0.38], [0.55, 0.32], [0.15, 0.32] ]}
      </Polygon>

      {/* Head Circle */}
      <Circle pos={[0.15, 0.35]} rad={0.075} fill={white} stroke={black} stroke-width={1.5} />

      {/* Eye */}
      <Circle pos={[0.14, 0.37]} rad={0.008} fill={black} />
    </Group>

    {/* Wing (Reaching for handlebars) */}
    <Group>
      <Ellipse pos={[0.05, 0.18]} rad={[0.1, 0.04]} rotate={-20} fill={white} stroke={black} stroke-width={1.5} />
      <Polygon fill={white} stroke={black} stroke-width={1.5}>
        {[ [0.11, 0.23], [0.27, 0.27], [0.29, 0.23], [0.13, 0.19] ]}
      </Polygon>
    </Group>

  </Group>
  </Group>
</TitleFrame>
