// plot two lines: (1) a sine wave in red; (2) the same sine wave with a lower amplitude higher frequency sine wave added on top (in blue)
<Plot xlim={[0, 2*pi]} ylim={[-1.5, 1.5]} aspect={phi} margin={0.2} grid>
  <DataPath fy={sin} stroke={red} stroke-width={2} />
  <DataPath fy={x => sin(x) + 0.2*sin(5*x)} stroke={blue} stroke-width={2} />
</Plot>
