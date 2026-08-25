// serve the built dist/ as a plain static site: `bun run preview`
import { serve, file } from "bun";
import { existsSync } from "node:fs";
import { join, normalize } from "node:path";

const DIST = new URL("./dist", import.meta.url).pathname;
if (!existsSync(join(DIST, "index.html"))) {
  console.error("no dist/index.html — run `bun run build` first");
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 3000);
const server = serve({
  port: PORT,
  fetch(req) {
    let path = normalize(decodeURIComponent(new URL(req.url).pathname));
    if (path.startsWith("..")) return new Response("not found", { status: 404 });
    if (path.endsWith("/")) path += "index.html";
    const data = file(join(DIST, path));
    return new Response(data);
  },
});

console.log(`report at ${server.url} (dist: ${DIST})`);
