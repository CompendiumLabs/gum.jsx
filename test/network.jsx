<TitleFrame rounded margin title="Basic Network" title-size={0.075}>
  <Network aspect={2}>
    <Node label="A" pos={[0.2, 0.4]}>Hello World!</Node>
    <Node label="B" pos={[0.7, 0.8]}>Here is text.</Node>
    <Node label="C" pos={[0.8, 0.2]}>And again.</Node>
    <Edge node1="A" node2="B" dir1="s" dir2="n"/>
    <Edge node1="A" node2="C" dir1="n" dir2="s"/>
  </Network>
</TitleFrame>
