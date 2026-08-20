// matrix environments: the body parses to an `array` node that convert_tree
// drops, so the entries vanish while the wrapping \left...\right delimiters
// survive and collapse onto empty content
<VStack spacing={0.1}>
  <Latex>{"A = \\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}"}</Latex>
  <Latex>{"B = \\begin{bmatrix} 1 & 0 \\\\ 0 & 1 \\end{bmatrix} \\quad C = \\begin{vmatrix} x & y \\\\ z & w \\end{vmatrix}"}</Latex>
  <Latex>{"D = \\begin{smallmatrix} 1 & 2 \\\\ 3 & 4 \\end{smallmatrix} \\quad E = \\begin{array}{cc} p & q \\\\ r & s \\end{array}"}</Latex>
</VStack>
