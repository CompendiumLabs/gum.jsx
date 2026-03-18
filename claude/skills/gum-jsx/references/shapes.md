# Shapes Elements

## Rect

*Inherits*: **Element**

This makes a rectangle. Without any arguments it will fill its entire allocated space. Unless otherwise specified, it has a `null` aspect. Use **Square** for a square with a unit aspect.

Specifying a `rounded` argument will round the borders by the same amount for each corner. This can be either a scalar or a pair of scalars corresponding to the x and y radii of the corners. To specify different roundings for each corner, use the **RoundedRect** element.

Parameters:
- `rounded` = `null` — proportional border rounding, accepts either scalar or pair of scalars

**Example**

Prompt: a rectangle on the left side of the figure with an aspect of roughly 1/2

Generated code:
```jsx
<Rectangle pos={[0.25, 0.5]} rad={[0.1, 0.2]}/>
```

## Ellipse

*Inherits*: **Element**

This makes an ellipse. Without any arguments it will inscribe its allocated space. Use **Circle** for a circle with a unit aspect.

**Example**

Prompt: two ellipses, one wider and one taller

Generated code:
```jsx
<Group>
  <Ellipse pos={[0.3, 0.2]} rad={[0.2, 0.1]} />
  <Ellipse pos={[0.6, 0.6]} rad={[0.2, 0.25]} />
</Group>
```

## Arc

*Inherits*: **Element**

This draws an elliptical arc that inscribes its allocated rectangle, like **Ellipse**, but only over a selected angular interval.

Parameters:
- `degrees` = `[0, 360]` — start and end angle in degrees
- `range` — alias for `degrees`

Angles follow gum's usual screen-space convention: `0` points right and `90` points down.

**Example**

Prompt: elliptical and circular arcs using degree ranges

Generated code:
```jsx
<Group>
  <Arc pos={[0.32, 0.5]} rad={[0.22, 0.16]} start={-45} end={210} stroke={blue} stroke-width={2} />
  <Arc pos={[0.72, 0.5]} rad={0.16} start={90} end={-150} stroke={red} stroke-width={2} />
</Group>
```

## Line

*Inherits*: **Element**

The `Line` element draws line segments through a series of points. It accepts a list of two or more points and connects them with straight line segments.

There are specialized variants for vertical and horizontal lines called **VLine** and **HLine**, which allow you to specify the position of the line (`loc`) and the range of the line (`lim`). See **UnitLine** for more details.

For smooth curves through points, use **Spline** instead.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)

**Example**

Prompt: draw a diagonal line in blue and a cup shaped line in red

Generated code:
```jsx
<Group>
  <Line stroke={blue} points={[
    [0.2, 0.2],
    [0.8, 0.8],
  ]} />
  <Line stroke={red} points={[
    [0.3, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
    [0.7, 0.3],
  ]} />
</Group>
```

## Shape

*Inherits*: **Pointstring** > **Element**

The `Shape` element draws a closed polygon through a series of points. It accepts a list of two or more points and connects them with straight line segments, automatically closing the shape by connecting the last point back to the first.

For open multiple-segment paths, use **Line** instead.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)

**Example**

Prompt: draw a blue triangle with a semi-transparent green square overlaid on top

Generated code:
```jsx
<Group>
  <Shape fill={blue} stroke={none} points={[
    [0.5, 0.2],
    [0.8, 0.8],
    [0.2, 0.8]
  ]} />
  <Shape fill={green} stroke={none} opacity={0.5} points={[
    [0.3, 0.3],
    [0.7, 0.3],
    [0.7, 0.7],
    [0.3, 0.7]
  ]} />
</Group>
```

## Spline

*Inherits*: **Path** > **Element**

This creates a smooth cardinal spline curve through a series of points. The tangent at each interior point is computed as the central difference between its neighbors, while endpoints use forward/backward differences. This produces a smooth, natural-looking curve that passes through all specified points.

The `curve` parameter controls the tension of the spline. Lower values (e.g., 0.5) create tighter curves with less overshoot, while higher values (e.g., 1.5) create looser, more flowing curves. The default value of 0.5 produces the canonical *Catmull-Rom* spline.

Parameters:
- `points` — array of point coordinates (minimum of 2 required)
- `curve` = `0.5` — tension parameter that scales the tangent vectors
- `closed` = `false` — toggles whether to make it a closed loop
- `tan1`/`tan2` — the tangent vectors at the first and last points

**Example**

Prompt: draw a blue cubic spline path filled with gray that looks like a pacman facing left, using 5 vertices. label the vertices with black dots and connect them with straight red lines. place the whole thing in a rounded frame.

Generated code:
```jsx
const points = [
  [0.25, 0.25],
  [0.75, 0.25],
  [0.75, 0.75],
  [0.25, 0.75],
  [0.50, 0.50],
]
return <Frame rounded margin>
  <Spline closed stroke={blue} fill={gray} points={points} />
  <Shape stroke={red} points={points} />
  <Points size={0.0075} points={points} />
</Frame>
```

## Arrow

*Inherits*: **Group** > **Element**

Draws a straight arrow between two points. This is the straight-line counterpart to **ArrowSpline**: it uses `from` and `to` endpoints, but renders a simple **Line** shaft instead of a curved spline.

The line and arrowhead can be styled separately using prefixed parameters. The head is built from **ArrowHead**-style geometry, while the shaft is a simple **Line**.

The arrow direction is inferred automatically from `from` to `to`.

Parameters:
- `points` — the points to draw the arrow between (can include intermediate points)
- `start_dir` / `end_dir` — the direction of the arrowheads at the start and end
- `arrow` / `arrow_start` / `arrow_end` — toggles whether the respective arrowheads are included. Defaults to `true` for `arrow_end` and `false` for `arrow_start`, meaning a directed graph edge
- `arrow_size` = `0.04` — size of the arrowhead
- `curve` = `null` — curvature factor forwarded to the spline (`null` or zero means straight line)

Subunit names:
- `line` — forwarded to the shaft line
- `arrow` — forwarded to the arrowhead
- `start` / `end` — forwarded to the start and end arrowheads respectively

**Example**

Prompt: the text "Blue Square" on the left with an arrow pointing to a blue square on the right

Generated code:
```jsx
<Frame rounded>
  <Group aspect={2}>
    <Text pos={[0.2, 0.5]} yrad={0.1} wrap={4} justify="center">Blue Square</Text>
    <Arrow points={[[0.3, 0.5], [0.6, 0.5]]} />
    <Square pos={[0.75, 0.5]} yrad={0.25} rounded fill={blue} />
  </Group>
</Frame>
```
