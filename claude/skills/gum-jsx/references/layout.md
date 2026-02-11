# Layout Elements

## Box

*Inherits*: **Group** > **Element**

This is a simple container class allowing you to add padding, margins, and a border to a single **Element**. It's pretty versatile and is often used to set up the outermost positioning of a figure. Mirroring the standard CSS definitions, padding is space inside the border and margin is space outside the border. This has no border by default, but there is a specialized subclass of this called **Frame** that defaults to `border = 1`.

**Box** can be pretty handly in various situations. It is differentiated from **Group** in that it will adopt the `aspect` of the child element. This is useful if you want to do something like shift an element up or down by a certain amount while maintaining its aspect ratio. Simply wrap it in a **Box** and set child's `pos` to the desired offset.

There are multiple ways to specify padding and margins. If given as a scalar, it is constant across all sides. If two values are given, they correspond to the horizontal and vertical sides. If four values are given, they correspond to `[left, top, right, bottom]`.

The `adjust` flag controls whether padding/margins are adjusted for the aspect ratio. If `true`, horizontal and vertical components are scaled so that their ratio is equal to the `child` element's aspect ratio. This yields padding/margins of constant apparent size regardless of aspect ratio. If `false`, the inputs are used as-is.

Parameters:
- `padding` = `0` / `0.1` — the padding to be added (inside border)
- `margin` = `0` / `0.1` — the margin to be added (outside border)
- `border` = `0` / `1` — the border width to use (stroke in pixels)
- `rounded` = `0` / `0.1` — the border rounding to use (proportional to the box size)
- `adjust` = `true` — whether to adjust values for aspect ratio
- `shape` = `Rect` — the shape class to use for the border
- `clip` = `false` — whether to clip the contents to the border shape

Subunit names:
- `border` — keywords to pass to border, such as `stroke` or `stroke-dasharray`

**Example**

Prompt: the text "hello!" in a frame with a dashed border and rounded corners

Generated code:
```jsx
<Box padding border rounded border-stroke-dasharray={5}>
  <Text>hello!</Text>
</Box>
```

## Stack

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

**Example**

Prompt: a wide blue rectangle on top, with red and green squares side by side on the bottom. each one has rounded corners.

Generated code:
```jsx
<VStack spacing>
  <Rectangle rounded fill={blue} />
  <HStack stack-size={0.5} spacing>
    <Square rounded fill={red} />
    <Square rounded fill={green} />
  </HStack>
</VStack>
```

## Grid

*Inherits*: **Group** > **Element**

This element arranges its children in a grid. The grid is specified by the number of rows and columns, and the gap between the cells. In the case where `widths` and `heights` are not specified, a reasonable effort is made to best accomodate the grid elements based on their aspects (if specified).

Parameters:
- `rows` = `N` — the number of rows in the grid (autodetected)
- `cols` = `M` — the number of columns in the grid (autodetected)
- `widths` = `[1/N,...]` — an array of widths for each column
- `heights` = `[1/M,...]` — an array of heights for each row
- `spacing` = `0` — the gap between the cells in the grid

**Example**

Prompt: draw a grid of square boxes filled in light gray. each box contains an arrow that is pointing in a particular direction. that direction rotates clockwise as we move through the grid.

Generated code:
```jsx
<Frame padding rounded>
  <Grid rows={3} spacing>
    { linspace(0, 360, 10).slice(0, 9).map(th =>
      <Frame padding rounded fill>
        <Group aspect={1} spin={th}>
          <Arrow direc={0} tail={1} pos={[1, 0.5]} rad={0.5} />
        </Group>
      </Frame>
    ) }
  </Grid>
</Frame>
```

## Points

*Inherits*: **Group** > **Element**

Place copies of a common shape at various points. The radius can be specified by the `size` keyword and overridden for particular children. The default shape is a black dot.

Keyword arguments:
- `children` — a list of points, where each point is either an `[x,y]` pair
- `shape` = `Dot` — the default shape to use for children
- `size` = `0.025` — the default radius to use for children
- `...` = `{}` — additional attributes are passed to the default shape (like `stroke` or `fill`)

**Example**

Prompt: A plot of three different increasing curves of varying steepness and multiple points spaced at regular intervals. The x-axis label is "time (seconds)", the y-axis label is "space (meters)", and the title is "Spacetime Vibes". There are axis ticks in both directions with assiated faint grid lines.

Generated code:
```jsx
<Plot xlim={[-1, 1]} ylim={[-1, 1]} grid margin={0.3} aspect xlabel="time (seconds)" ylabel="space (meters)" title="Spacetime Vibes">
  <Points size={0.02}>{[
    [0, 0.5], [0.5, 0], [-0.5, 0], [0, -0.5]
  ]}
  </Points>
  <Rectangle pos={[0.5, 0.5]} rad={0.1} />
  <Circle pos={[-0.5, -0.5]} rad={0.1} />
  {[0.5, 0.9, 1.5].map(a =>
    <SymLine fy={x => sin(a*x)} />
  )}
</Plot>
```
