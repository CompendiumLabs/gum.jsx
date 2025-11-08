<Frame margin clip shape={<Ellipse />}>
  <Graph xlim={[-3/4*pi, 3/4*pi]} ylim={[1.5, -1.5]} aspect={1.5}>
    <DataFill fy1={1.5} fy2={sin} fill={red} />
    <DataFill fy1={-1.5} fy2={sin} fill={blue} />
  </Graph>
</Frame>
