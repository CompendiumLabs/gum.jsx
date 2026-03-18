# Set Theory

This is a compact set-diagram example built around a small local helper. The `Set` component is just a [Frame](/docs/Frame) with an elliptical shape and an internal label, which makes it easy to place several sets without repeating the same styling logic. When setting a custon `shape` on **Frame** (the default is **Rect**), you may need to increase the `padding` to ensure the label fits neatly within the frame.

The actual set relationships are expressed entirely through positioning and scale. There is no boolean geometry here; the picture just relies on overlapping translucent ellipses and containment. That keeps the construction simple while still giving a recognizable set-theory diagram.