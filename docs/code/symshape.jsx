// Draw a rounded star shape with a blue fill
const rad = t => 1 - 0.3 * cos(2.5 * t)**2
return <SymShape fill={blue} tlim={[0, 2*pi]} N={200}
  fx={t => rad(t) * sin(t)}
  fy={t => rad(t) * cos(t)}
/>
