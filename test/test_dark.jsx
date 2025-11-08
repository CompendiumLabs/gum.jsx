<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} grid margin={0.2} grid-stroke={white} axis-stroke={white} axis-label-color={white}>
  <DataPath fy={sin} stroke={blue} stroke-width={2} />
  <DataPoints fy={sin} N={10} size={0.06} fill={white} />
</Plot>
