const [labs, vals] = zip(
  ["GPT-4o", 0.4], ["OpenAI o1", 3.2], ["OpenAI o4-mini", 8.3], ["Gemini 3 Pro", 12.4],
  ["OpenAI o3", 14.1], ["Grok 4", 15.9], ["Claude Opus 4.5", 17.5], ["GPT-5.2", 25.2],
)
return <Plot
  aspect={1.6} margin={[0.2, 0.1, 0.2, 0.35]} ylim={[0, 30]} xanchor={-0.6} yanchor={-0.55}
  xticks={enumerate(labs)} yticks={linspace(0, 30, 7)} axis-tick-side="outer" xaxis-line-lim={[0, 7]}
  xaxis-label-spin={-45} xaxis-label-justify="right" xaxis-label-loc={0.7}
>
  <Bars rounded={0.1} width={0.85}>{vals}</Bars>
  {vals.map((s, i) => <TextSpan pos={[i, s+1.3]} yrad={0.75}>{`${s}%`}</TextSpan> )}
</Plot>
