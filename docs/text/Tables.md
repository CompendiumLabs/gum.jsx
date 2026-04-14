# Tables

The `loadTable` function reads a CSV file from the host environment and parses it into an array of row objects, making it easy to drive visualizations from external data. It's only available when the host passes a `loadFile` resolver into `evaluate`, so it's typically used when running `gum` against a file on disk rather than a bare snippet.

The first row of the CSV is treated as a header and each subsequent row becomes an object keyed by those column names. Numeric-looking values are automatically coerced to numbers, so `x` and `y` columns come back as numbers rather than strings.

If you already have a CSV string in hand (e.g. from a fetch, a literal, or another data source), you can call `parseTable(text, args)` directly to skip the file-loading step. `parseTable` takes the same optional config and returns the same array of row objects — `loadTable` is just a thin wrapper that reads the file and forwards the text to it.

Parameters:
- `path` — path to the CSV file, resolved relative to the current `.jsx` file
- `args` — optional Papa Parse [config](https://www.papaparse.com/docs#config) to override the defaults (`header: true`, `dynamicTyping: true`, `skipEmptyLines: 'greedy'`)
