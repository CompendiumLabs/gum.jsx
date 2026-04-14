# Images

The `LoadImage` element loads a PNG file from the host environment and embeds it as a base64 data URL. It's a thin wrapper around [PngImage](/docs/Element) that defers the file read to the host's `loadFile` resolver, so it's only available when `gum` is run against a file on disk (not bare snippets piped in via stdin).

Because it extends `PngImage`, it accepts all the standard image attributes (sizing, positioning, opacity, etc.) in addition to the `id` used to locate the file.

Parameters:
- `id` — path to the PNG file, resolved relative to the current `.jsx` file
- additional attributes are forwarded to the underlying `PngImage`
