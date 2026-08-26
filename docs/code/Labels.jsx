// tick labels along the bottom and left of a square, laid out the way an axis
// places them: each strip is thin, and each label gets a square box the
// strip's width on a side, so the text is that tall. One label is spun and
// one is a math element
<Group>
  <Rect rect={[0.2, 0, 1, 0.8]} stroke-dasharray={4} opacity={0.5} />
  <HLabels rect={[0.2, 0.83, 1, 0.88]}>
    <Label loc={0.1}>zero</Label>
    <Label loc={0.4}>one</Label>
    <Label loc={0.65} spin={-45}>spun</Label>
    <Label loc={0.9} color={blue}>three</Label>
  </HLabels>
  <VLabels rect={[0.12, 0, 0.17, 0.8]} justify="right">
    <Label loc={0.2}>high</Label>
    <Label loc={0.5}><Latex>{"x^2"}</Latex></Label>
    <Label loc={0.8}>low</Label>
  </VLabels>
</Group>
