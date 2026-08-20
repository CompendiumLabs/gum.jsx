// cases/aligned/gathered/substack are all `array` nodes too; each row keeps its
// leading term so the missing body is visible as a gap
<VStack spacing={0.1}>
  <Latex>{"f(x) = \\begin{cases} x & x > 0 \\\\ -x & x \\le 0 \\end{cases}"}</Latex>
  <Latex>{"\\begin{aligned} a &= b + c \\\\ d &= e \\end{aligned}"}</Latex>
  <Latex>{"\\begin{gathered} u = v \\\\ w = z \\end{gathered}"}</Latex>
  <Latex>{"\\sum_{\\substack{i < j \\\\ j < k}} a_{ij} = 1"}</Latex>
</VStack>
