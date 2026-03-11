// draw a grid of square boxes filled in light gray. each box contains an arrow that is pointing in a particular direction. that direction rotates clockwise as we move through the grid.
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
