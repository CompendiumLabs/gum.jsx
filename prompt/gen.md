# Commands

To test the output of a particular `gum.jsx` snippet or file, you can pipe it to the `gum-cli` command, which is assumed to be installed globally. If you have vision capabilities, this can be useful for see the actual output of the code, either in SVG or PNG format. Even without vision, one can infer properties of the output by reading the SVG output directly.

For one off tests, pipe the code using `echo`. It is recommended that you use single quotes as the outer delimiter, to accommodate code that includes double quotes for component properties (e.g. `justify="left"`).

For more difficult tasks, use a file and `cat` it in. Using a file allows you to view and refine your code repeatedly. If you wish to avoid output redirection to a file, use the `-o` option to write to a file.

In general, it makes a lot of sense to write a draft to a file, view its output, then refine the code until you're satisfied. This way you can start simple and add complexity as needed.

**Examples:**
```bash
# Generate SVG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum-cli -f svg > output.svg

# Generate PNG from a gum.jsx snippet
echo '<Rectangle rounded fill={blue} />' | gum-cli -f png > output.png

# Generate SVG from a .jsx file
cat test.jsx | gum-cli -f svg > output.svg

# Generate PNG from a .jsx file
cat test.jsx | gum-cli -f png > output.png

# Generate SVG from a .jsx file without output redirection
cat test.jsx | gum-cli -f svg -o output.svg

# Generate PNG from a .jsx file without output redirection
cat test.jsx | gum-cli -f png -o output.png
```

**CLI options:**
- `-s, --size <size>`: size of the SVG (default: 750)
- `-w, --width <width>`: width of the PNG (default: null)
- `-h, --height <height>`: height of the PNG (default: null)
- `-f, --format <format>`: format: svg or png (default: svg)
- `-t, --theme <theme>`: theme to use (default: dark)
- `-b, --background <color>`: background color (default: null)
- `-o, --output <output>`: output file (default: null)
