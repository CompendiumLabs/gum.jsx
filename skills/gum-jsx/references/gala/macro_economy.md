# Macro Economy

This figure uses the **Network** elements in a fairly direct way. The main sectors of the economy are represented as named **Node**s, and the high-level flows between them are drawn as **Edge**s with a few curved routes to keep the diagram readable.

What makes it work is the mix of abstraction levels. The node and edge structure is handled by **Network**, but the descriptive flow labels are placed manually with **Text**, often with a bit of `spin` to follow the direction of the arrows. That gives you the convenience of a graph layout without giving up control over the annotations.

The color palette also does useful work here. Each sector gets its own color family, and the central producer-consumer exchange is labeled in matching colors, so the main flows stand out from the secondary tax and transfer loops.

**Code**

```jsx
const col = {
  prod: '#1e88e5',
  cons: '#4caf50',
  govt: '#ff0d57',
  trade: '#ffb300',
}

return <Slide title="Macroeconomic Flows">
  <Network aspect={2} coord={[0, 0, 1.6, 0.8]} node-ysize={0.16} node-rounded={0.06} node-fill={gray} node-fill-opacity={0.15} edge-stroke-width={1} edge-arrow-size={0.04} edge-stroke="#444" edge-arrow edge-arrow-curve={2.5} node-text-wrap={6}>
    <Node id="trade" pos={[0.8, 0.15]} fill={col.trade} border-stroke={col.trade} text-color={col.trade}>Foreign Trade</Node>
    <Node id="prod" pos={[0.3, 0.4]} fill={col.prod} border-stroke={col.prod} text-color={col.prod}>Producers (Firms)</Node>
    <Node id="cons" pos={[1.3, 0.4]} fill={col.cons} border-stroke={col.cons} text-color={col.cons}>Consumers (Households)</Node>
    <Node id="govt" pos={[0.8, 0.65]} ysize={0.12} fill={col.govt} border-stroke={col.govt} text-color={col.govt}>Government</Node>

    <Edge start="prod" end="cons" />
    <Edge start="govt" end="prod" end-side="s" />
    <Edge start="govt" end="cons" end-side="s" />
    <Edge start="trade" end="prod" end-side="n" />
    <Edge start="trade" end="cons" end-side="n" />

    <Text pos={[0.8, 0.35]} ysize={0.05} color={col.prod}>Goods + Services →</Text>
    <Text pos={[0.8, 0.45]} ysize={0.05} color={col.cons}>← Wages, Rent, Profit</Text>
    <Text pos={[0.3, 0.65]} ysize={0.045} spin={30}>Subsidies / Taxes</Text>
    <Text pos={[1.3, 0.65]} ysize={0.045} spin={-30}>Transfers / Taxes</Text>
    <Text pos={[0.3, 0.13]} ysize={0.045} spin={-30}>Imports / Exports</Text>
    <Text pos={[1.3, 0.13]} ysize={0.045} spin={30}>Transfers</Text>
  </Network>
</Slide>
```