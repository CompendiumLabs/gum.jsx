// plot the exponential of sin(x) over [0, 2π]
<Frame margin={0.15}>
  <Plot aspect={phi} xlim={[0, 2*pi]} ylim={[0, 3]} grid>
    <DataPath fy={x => exp(sin(x))} />
  </Plot>
</Frame>
