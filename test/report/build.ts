// production build: `bun run build` → dist/ (bun build's CLI cannot take the tailwind plugin)
import tailwind from "bun-plugin-tailwind";

const result = await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir: "./dist",
  plugins: [tailwind],
  // copy the fonts next to the css instead of inlining the small ones as data uris
  loader: { ".ttf": "file" },
  minify: true,
  sourcemap: "linked",
  define: { "process.env.NODE_ENV": '"production"' },
});
if (!result.success) {
  for (const log of result.logs) console.error(log);
  process.exit(1);
}
console.log(`built ${result.outputs.length} files into dist/`);
