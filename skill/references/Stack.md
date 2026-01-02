# Stack

*Inherits*: **Group** > **Element**

Stack one or more **Element** either vertically or horizontally. There are specialized components **VStack** and **HStack** that don't take the `direc` argument. Proportional spacing between children can be specified with the `spacing` parameter.

Elements can specify their own sizing with the `stack-size` parameter. If `stack-size` is not specified and `stack-expand` is not set to `false`, space will be distributed according to the child's aspect ratio. If `stack-expand` is set to `false`, the child will be given an even share of the remaining space.

Whenever possible, the aspect ratio of the overall stack is set so that all elements with defined aspect ratios will reach full width (in the **VStack** case) or full height (in the **HStack** case).

Child parameters:
- `stack-size` = `null` — the size of the child element
- `stack-expand` = `true` — whether to expand the child to fill the remaining space

Parameters:
- `direc` — the direction of stacking: `v` or `h`
- `spacing` = `0` — total amount of space to add between child elements

## Example

Prompt: a wide blue rectangle on top, with red and green squares side by side on the bottom. each one has rounded corners.

Generated code:
```jsx
<VStack spacing>
  <Rect rounded fill={blue} />
  <HStack stack-size={0.5} spacing>
    <Square rounded fill={red} />
    <Square rounded fill={green} />
  </HStack>
</VStack>
```
