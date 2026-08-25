import { serve, file } from "bun";
import { join, normalize } from "node:path";
import index from "./index.html";

// the svg files and manifest `bun scripts/test.ts --report` wrote, in the repo's
// test/data; override with GUM_REPORT_DATA=/path/to/data
const DATA = process.env.GUM_REPORT_DATA ?? new URL("../../data", import.meta.url).pathname;

// serve one file out of the data directory, refusing paths that climb out of it
function serveData(path: string, type: string) {
  const rel = normalize(decodeURIComponent(path));
  if (rel.startsWith("..")) return new Response("not found", { status: 404 });
  return new Response(file(join(DATA, rel)), { headers: { "content-type": type } });
}

const server = serve({
  routes: {
    "/*": index,
    "/manifest.json": async () => {
      const data = file(join(DATA, "manifest.json"));
      if (!(await data.exists())) {
        return Response.json(
          { error: `no manifest in ${DATA} — run \`bun scripts/test.ts --report\` first` },
          { status: 404 },
        );
      }
      return new Response(data, { headers: { "content-type": "application/json" } });
    },
    "/data/*": req => serveData(new URL(req.url).pathname.slice("/data/".length), "image/svg+xml"),
  },
  development: process.env.NODE_ENV !== "production" && { hmr: true, console: true },
});

console.log(`report at ${server.url} (data: ${DATA})`);
