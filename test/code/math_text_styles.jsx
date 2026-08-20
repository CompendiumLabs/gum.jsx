// SILENT GAP: the \text* family all resolves to KaTeX_Main-Regular because the
// bold/italic/sans/mono faces are never loaded, so these rows are identical
<VStack spacing={0.1}>
  <Latex>{"\\text{plain} \\quad \\textrm{roman} \\quad \\textnormal{normal}"}</Latex>
  <Latex>{"\\textbf{bold} \\quad \\textmd{medium} \\quad \\textit{italic}"}</Latex>
  <Latex>{"\\textup{upright} \\quad \\emph{emphasis} \\quad \\textsf{sans} \\quad \\texttt{mono}"}</Latex>
</VStack>
