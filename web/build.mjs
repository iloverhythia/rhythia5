import * as esbuild from "esbuild";
import fs from "fs";
import path from "path";
// Run from the repo root: node web/build.mjs  (writes boot.js, chunk-*.js, index.html and manifest.json to the root for GitHub Pages)
const S = (f) => path.resolve("web/shims", f);
const alias = {
  raylib: S("raylib.ts"), fs: S("fs.ts"), "fs/promises": S("fs-promises.ts"), path: path.resolve("node_modules/path-browserify/index.js"),
  os: S("os.ts"), crypto: S("crypto.ts"), zlib: S("zlib.ts"), child_process: S("child_process.ts"), "timers/promises": S("timers-promises.ts"),
  winston: S("winston.ts"), "steamworks.js": S("steamworks.ts"), "steamworks.js/client": S("steamworks.ts"),
  "rhythia-api": S("rhythia-api.ts"), "rhythia-api/handleApi": S("rhythia-api.ts"),
  express: S("express.ts"), http: S("http.ts"), "@2toad/profanity": path.resolve("node_modules/@2toad/profanity/dist/index.js"), simplevideo: S("simplevideo.ts"), sharp: S("sharp.ts"), nativefiledialog: S("nativefiledialog.ts"),
  buffer: path.resolve("node_modules/buffer/index.js"), events: path.resolve("node_modules/events/events.js"),
};
const shim = {
  name: "shim",
  setup(b) {
    b.onResolve({ filter: /.*/ }, (a) => (alias[a.path] ? { path: alias[a.path] } : null));
    b.onResolve({ filter: /auth\/supabase$/ }, (a) => (/[\\/]src[\\/]/.test(a.importer) ? { path: path.resolve("web/overrides/auth-supabase.ts") } : null));
    b.onLoad({ filter: /[\\/]src[\\/].*\.ts$/ }, async (a) => {
      let src = await fs.promises.readFile(a.path, "utf8");
      src = src.replace(/(=|return)\s*openDialog\(/g, "$1 await openDialog(").replace(/(=|return)\s*openFolderDialog\(/g, "$1 await openFolderDialog(");
      return { contents: src, loader: "ts" };
    });
  },
};
await esbuild.build({
  entryPoints: ["web/boot.ts"], bundle: true, format: "esm", splitting: true, outdir: ".", platform: "browser",
  target: "es2022", plugins: [shim], minify: true, keepNames: true, sourcemap: false, logLevel: "warning", define: { "process.env.NODE_ENV": '"production"' },
  chunkNames: "chunk-[hash]",
});
const list = [];
const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else list.push({ p: p.replace(/\\/g, "/"), s: fs.statSync(p).size }); } };
walk("public"); list.push({ p: "keybinds.json", s: fs.statSync("keybinds.json").size });
fs.writeFileSync("manifest.json", JSON.stringify(list));
fs.copyFileSync("web/page.html", "index.html");
console.log("built web page");
