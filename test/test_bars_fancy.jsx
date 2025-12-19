const ErrorBar = args => <Group {...args}><HLine loc={0}/><VLine/><HLine loc={1}/></Group>
const [labs, vals] = zip(
  ["GPT-4o", 0.4], ["OpenAI o1", 3.2], ["OpenAI o4-mini", 8.3], ["Gemini 3 Pro", 12.4],
  ["OpenAI o3", 14.1], ["Grok 4", 15.9], ["Claude Opus 4.5", 17.5], ["GPT-5.2", 25.2],
)
const yticks = linspace(0, 30, 7).map(v => [v, `${v}%`])
const title = <TextFrame rounded={0.15}>Research accuracy across models</TextFrame>
return <Plot
  aspect={1.6} margin={0.3} ylim={[0, 30]} xticks={enumerate(labs)} yticks={yticks} xpad={0.015} ypad={0.02}
  yaxis-tick-pos="outer" xaxis-tick-pos="outer" xaxis-line-lim={[0, 7]} yaxis-line-lim={[0, 30]}
  xaxis-label-spin={-45} xaxis-label-justify="right" xaxis-label-loc={0.7} xaxis-label-offset={0.3}
  ylabel="Accuracy (%)" title={title} title-size={0.12} title-offset={0} ylabel-size={0.035}
>
  <Bars rounded={0.05} fill='#a2d475' width={0.9}>{vals}</Bars>
  {vals.map((s, i) => <TextSpan pos={[i, 1.2*s+1.5]} yrad={0.7}>{`${s}%`}</TextSpan> )}
  {vals.map((s, i) => <ErrorBar pos={[i, s]} xrad={0.1} yrad={0.2*s}/> )}
</Plot>
