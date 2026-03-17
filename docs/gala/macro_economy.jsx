const col = {
  prod: '#1e88e5',
  cons: '#4caf50',
  govt: '#ff0d57',
  trade: '#ffb300',
}

return <TitleFrame title="Simple Macroeconomic Flow" title-size={0.06} rounded padding={0.05} margin>
  <Network aspect={2} coord={[0, 0, 1.6, 0.8]} node-yrad={0.08} node-rounded={0.06} node-fill={gray} node-text-color="#333" edge-stroke-width={2} edge-arrow-size={0.02} edge-stroke="#444">
    <Node id="trade" pos={[0.8, 0.15]} fill={col.trade} fill-opacity={0.15} border-stroke={col.trade} wrap={6}>Foreign Trade</Node>
    <Node id="prod" pos={[0.3, 0.4]} fill={col.prod} fill-opacity={0.15} border-stroke={col.prod} wrap={6}>Producers (Firms)</Node>
    <Node id="cons" pos={[1.3, 0.4]} fill={col.cons} fill-opacity={0.15} border-stroke={col.cons} wrap={6}>Consumers (Households)</Node>
    <Node id="govt" pos={[0.8, 0.65]} yrad={0.06} fill={col.govt} fill-opacity={0.15} border-stroke={col.govt} wrap={6}>Government</Node>

    <Edge start="prod" end="cons" arrow />
    <Edge start="govt" end="prod" end-dir="s" arrow curve={2.5} />
    <Edge start="govt" end="cons" end-dir="s" arrow curve={2.5} />
    <Edge start="trade" end="prod" end-dir="n" arrow curve={2.5} />
    <Edge start="trade" end="cons" end-dir="n" arrow curve={2.5} />

    <Text pos={[0.8, 0.35]} yrad={0.025} color={col.prod}>Goods + Services →</Text>
    <Text pos={[0.8, 0.45]} yrad={0.025} color={col.cons}>← Wages, Rent, Profit</Text>
    <Text pos={[0.3, 0.65]} yrad={0.02} color={darkgray} spin={30}>Subsidies / Taxes</Text>
    <Text pos={[1.3, 0.65]} yrad={0.02} color={darkgray} spin={-30}>Transfers / Taxes</Text>
    <Text pos={[0.3, 0.13]} yrad={0.02} color={darkgray} spin={-30}>Imports / Exports</Text>
    <Text pos={[1.3, 0.13]} yrad={0.02} color={darkgray} spin={30}>Transfers</Text>
  </Network>
</TitleFrame>
