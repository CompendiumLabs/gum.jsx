# BarPlot

*Inherits*: **Plot** > **Group** > **Element**

Makes a plot featuring a bar graph. This largely wraps the functionality of **Plot** but takes care of labelling and arranging the `xaxis` information. You can provide `label` and `size` attributes to the child elements. The **Bar**/**VBar**/**HBar** elements are just very thin wrappers around **Rect** elements, and you can use other elements in their place if you wish.

To layout just the bars without axes, use the **Bars** element directly, which this wraps using **Plot**. This way, you can plot other elements alongside the bars, such as labels or error bars. By default, the bars will be placed at `[0, ..., N-1]` along the x-axis.

Child parameters:
- `label` — the label for the bar
- `size` — the height of the bar

Parameters:
- `direc` = `v` — the orientation of the bars in the plot

Subunit names:
- `bar` — keywords to pass to the underlying **Bars** element

## Example

Prompt: A plot with three bars with black borders at "A", "B", and "C". The first bar is red and is the shortest, the second bar is blue and is the tallest, while the third bar is green and its height is in between.

Generated code:
```jsx
<BarPlot ylim={[0, 10]} yticks={6} ygrid title="Example BarPlot" xlabel="Category" ylabel="Value" margin={0.25}>
  <Bar label="A" size={3} fill={red} />
  <Bar label="B" size={8.5} fill={blue} />
  <Bar label="C" size={6.5} fill={green} />
</BarPlot>
```
