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

## Line

*Inherits*: **Element**

The `Line` element draws line segments through a series of points. It accepts a list of two or more points and connects them with straight line segments.

There are specialized variants for vertical and horizontal lines called **VLine** and **HLine**, which allow you to specify the position of the line (`loc`) and the range of the line (`lim`). See **UnitLine** for more details.

For smooth curves through points, use **Spline** instead.

Parameters:
- `children` — array of point coordinates (minimum of 2 required)

**Example**

Prompt: draw a diagonal line in blue and a cup shaped line in red

Generated code:
```jsx
<Group>
  <Line stroke={blue}>{[
    [0.2, 0.2],
    [0.8, 0.8],
  ]}</Line>
  <Line stroke={red}>{[
    [0.3, 0.3],
    [0.3, 0.7],
    [0.7, 0.7],
    [0.7, 0.3],
  ]}</Line>
</Group>
```

## Shape

*Inherits*: **Pointstring** > **Element**

The `Shape` element draws a closed polygon through a series of points. It accepts a list of two or more points and connects them with straight line segments, automatically closing the shape by connecting the last point back to the first.

For open multiple-segment paths, use **Line** instead.

Parameters:
- `children` — array of point coordinates (minimum of 2 required)

**Example**

Prompt: draw a blue triangle with a semi-transparent green square overlaid on top

Generated code:
```jsx
<Group>
  <Shape fill={blue} stroke={none}>{[
    [0.5, 0.2],
    [0.8, 0.8],
    [0.2, 0.8]
  ]}</Shape>
  <Shape fill={green} stroke={none} opacity={0.5}>{[
    [0.3, 0.3],
    [0.7, 0.3],
    [0.7, 0.7],
    [0.3, 0.7]
  ]}</Shape>
</Group>
```

## Spline

*Inherits*: **Path** > **Element**

This creates a smooth cardinal spline curve through a series of points. The tangent at each interior point is computed as the central difference between its neighbors, while endpoints use forward/backward differences. This produces a smooth, natural-looking curve that passes through all specified points.

The `curve` parameter controls the tension of the spline. Lower values (e.g., 0.5) create tighter curves with less overshoot, while higher values (e.g., 1.5) create looser, more flowing curves. The default value of 0.5 produces the canonical *Catmull-Rom* spline.

Parameters:
- `children` — array of point coordinates (minimum of 2 required)
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
  <Spline closed stroke={blue} fill={gray}>{points}</Spline>
  <Shape stroke={red}>{points}</Shape>
  <Points size={0.0075}>{points}</Points>
</Frame>
```
