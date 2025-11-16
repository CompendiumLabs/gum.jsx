const plot = <Frame rounded fill padding={0.2} margin>
  <DataPath aspect fy={sin} xlim={[0, 2*pi]} stroke={blue} stroke-width={2}/>
</Frame>
return <Frame padding rounded margin fill={white}>
  <Markdown wrap={15}>
    Hello **world**. This 안녕 is a *test*!
    Thank you. Suppose we have a term that is large.
    {plot}{plot}{plot} testing
    that $\sin(x)$ is a function
  </Markdown>
</Frame>
