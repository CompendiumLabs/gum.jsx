# Axis

*Inherits*: **Group** > **Element**

A single vertical or horizontal axis for plotting. This includes the central line, the perpendicual ticks, and their associated tick labels. Note that the proper bounds encompass only the central line and ticks, while the tick labels may fall well outside of them. Use **HAxis** and **VAxis** for specific directions.

Because `Axis` is used primarily for **Plot**, the `tick-side` parameter is inverted for `VAxis`, meaning `outer` points up and `inner` points down. Meanwhile, for `HAxis`, `outer` points to the left and `inner` points to the right.

Parameters:
- `direc` — the orientation of the axis, either `v` (vertical) or `h` (horizontal)
- `ticks` — a list of tick `[location, label]` pairs. The label can either be an `Element` or a string
- `lim` = `[0, 1]` — the extent of the element along the main axis
- `tick-side` = `'both'` — one of `'inner'` / `'outer'` / `'both'` / `'none'` , or a pair representing a numerical range in `[0, 1]`, where zero is oriented in the inner direction
- `label-side` = same as `tick-side` but for the labels
- `children` = a list of `Element`s to use as the tick labels instead of `ticks`. These must have a `loc` to tell `Axis` where to place the label and associated tick.

Subunits:
- `line`: the central line along the main axis
- `tick`: the perpendicular tick marks (collectively)
- `label`: the labels annotating the tick marks (collectively)

## Example

Prompt: a horizontal axis with 5 ticks labeled with emojis for: mount fuji, a rocket, a whale, a watermellon, and a donut

Generated code:
```jsx
const emoji = ['🗻', '🚀', '🐳', '🍉', '🍩']
const ticks = zip(linspace(0, 1, emoji.length), emoji)
return <Box padding>
  <HAxis yrect={[0.45, 0.55]} ticks={ticks} tick-side="outer" label-size={1} />
</Box>
```
