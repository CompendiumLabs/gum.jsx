# Grid

*Inherits*: **Group** > **Element**

This element arranges its children in a grid. The grid is specified by the number of rows and columns, and the gap between the cells. In the case where `widths` and `heights` are not specified, a reasonable effort is made to best accomodate the grid elements based on their aspects (if specified).

Parameters:
- `rows` = `N` — the number of rows in the grid (autodetected)
- `cols` = `M` — the number of columns in the grid (autodetected)
- `widths` = `[1/N,...]` — an array of widths for each column
- `heights` = `[1/M,...]` — an array of heights for each row
- `spacing` = `0` — the gap between the cells in the grid

## Example

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
