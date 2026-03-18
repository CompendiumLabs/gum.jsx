# Pendulum Physics

This is a diagrammatic example more than a plotting one. The structure is driven by a few physical parameters like the pendulum length and angle, and then the visible points are derived from those with `polar`. That makes the rod, bob, tension arrow, gravity arrow, and labels all stay in sync if you change the setup.

The figure also shows how well simple geometry mixes with mathematical text. Most of the picture is built from basic shapes and arrows, while the labels and equation use `Latex` to give it a textbook feel. The mesh background and muted palette help reinforce that classroom-diagram look without adding much code.

One useful trick used here is setting `clip` on the **Frame** to hide the upper part of the anchoring rectangle. Note that when you do apply `clip`, you may need to increase the `border` value since half of it will be cut off.