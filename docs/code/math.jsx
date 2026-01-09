// plot the exponential of sin(x) over [0, 2π]
<Box margin={0.15}>
  <Plot aspect={phi} xlim={[0, 2*pi]} ylim={[0, 3]} grid>
    <SymCurve fy={x => exp(sin(x))} />
  </Plot>
</Box>
