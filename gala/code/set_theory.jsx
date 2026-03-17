const Set = ({ label, label_pos, label_rad = 0.15, fill = "#C8CAE3", ...args }) =>
  <Frame flex fill={fill} shape={<Ellipse/>} {...args}>
    <Text pos={label_pos} rad={label_rad}>{label}</Text>
  </Frame>
return <TitleFrame rounded padding={0.2} margin={0.3} title="Set Theory">
  <Group aspect>
    <Set label="A" label-pos={[0.2, 0.7]} label-rad={0.07} fill-opacity={0.5} />
    <Set label="B" pos={[0.60, 0.20]} rad={0.1} />
    <Set label="C" pos={[0.55, 0.75]} rad={0.15} />
  </Group>
</TitleFrame>
