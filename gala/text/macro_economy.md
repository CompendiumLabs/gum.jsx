# Macro Economy

This figure uses the [Network](/docs/Network) elements in a fairly direct way. The main sectors of the economy are represented as named **Node**s, and the high-level flows between them are drawn as **Edge**s with a few curved routes to keep the diagram readable.

What makes it work is the mix of abstraction levels. The node and edge structure is handled by **Network**, but the descriptive flow labels are placed manually with **Text**, often with a bit of `spin` to follow the direction of the arrows. That gives you the convenience of a graph layout without giving up control over the annotations.

The color palette also does useful work here. Each sector gets its own color family, and the central producer-consumer exchange is labeled in matching colors, so the main flows stand out from the secondary tax and transfer loops.