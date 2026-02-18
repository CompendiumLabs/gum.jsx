// create a custom triangle element called `Tri` and use it to create a triangle with a gray fill
const Tri = ({ pos0, pos1, pos2, ...attr }) => <Shape {...attr} data={[pos0, pos1, pos2]} />
return <Tri pos0={[0.5, 0.1]} pos1={[0.9, 0.9]} pos2={[0.1, 0.9]} fill={gray} />
