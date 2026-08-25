// production build: `bun run build` → dist/ (bun build's CLI cannot take the tailwind plugin)
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from "node:fs";
import { join } from "node:path";
import tailwind from "bun-plugin-tailwind";

const OUT = "./dist";
// the svg files and manifest `bun scripts/test.ts --report` wrote, as in src/index.ts
const DATA = process.env.GUM_REPORT_DATA ?? new URL("../data", import.meta.url).pathname;

rmSync(OUT, { recursive: true, force: true });

const result = await Bun.build({
  entrypoints: ["./src/index.html"],
  outdir: OUT,
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

// dist is static: there is no server to route /manifest.json and /data/*, so the
// data goes in beside the bundle (the app fetches both relative to the page)
if (!existsSync(join(DATA, "manifest.json"))) {
  console.error(`no manifest in ${DATA} — run \`bun scripts/test.ts --report\` first`);
  process.exit(1);
}
cpSync(join(DATA, "manifest.json"), join(OUT, "manifest.json"));
mkdirSync(join(OUT, "data"), { recursive: true });
const groups = readdirSync(DATA, { withFileTypes: true }).filter(e => e.isDirectory());
for (const group of groups) {
  cpSync(join(DATA, group.name), join(OUT, "data", group.name), { recursive: true });
}

console.log(`built ${result.outputs.length} files into dist/ (data: ${groups.map(g => g.name).join(", ")})`);
