import { Buffer } from "buffer";
import { vfs } from "./shims/vfs";
import { registerBitmap, registerFont } from "./shims/raylib";

const g: any = globalThis;
g.Buffer = Buffer;
g.global = g;
g.process = g.process || {
  platform: "win32", env: {}, argv: ["rhythia"], versions: { node: "20.0.0" }, version: "v20.0.0", pid: 1, arch: "x64",
  cwd: () => "/app", exit: () => {}, on: () => g.process, once: () => g.process, off: () => g.process, emit: () => false,
  nextTick: (fn: any, ...a: any[]) => queueMicrotask(() => fn(...a)), hrtime: Object.assign((p?: [number, number]) => {
    const t = performance.now() / 1000; const s = Math.floor(t), n = Math.floor((t - s) * 1e9);
    return p ? [s - p[0], n - p[1]] : [s, n];
  }, { bigint: () => BigInt(Math.floor(performance.now() * 1e6)) }),
  memoryUsage: () => ({ rss: 0, heapUsed: 0, heapTotal: 0, external: 0 }), uptime: () => performance.now() / 1000,
  stdout: { write: (s: string) => console.log(s) }, stderr: { write: (s: string) => console.error(s) },
};
addEventListener("unhandledrejection", (e: any) => { const r = e.reason; console.error("unhandled rejection:", r && (r.stack || (() => { try { return JSON.stringify(r); } catch { return String(r); } })())); });
addEventListener("error", (e: any) => { console.error("uncaught:", e.error && e.error.stack || e.message); });
if (!g.setImmediate) g.setImmediate = (fn: any, ...a: any[]) => setTimeout(fn, 0, ...a);

const status = document.getElementById("status")!;
const bar = document.getElementById("bar")!;
const setStatus = (s: string, p?: number) => { status.textContent = s; if (p != null) bar.style.width = Math.round(p * 100) + "%"; };

function ttfMetrics(b: Uint8Array) {
  const dv = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const n = dv.getUint16(4); let upem = 1000, asc = 800, desc = -200;
  for (let i = 0; i < n; i++) {
    const o = 12 + i * 16; const tag = String.fromCharCode(b[o], b[o + 1], b[o + 2], b[o + 3]); const off = dv.getUint32(o + 8);
    if (tag === "head") upem = dv.getUint16(off + 18);
    if (tag === "hhea") { asc = dv.getInt16(off + 4); desc = dv.getInt16(off + 6); }
  }
  return { upem, asc, desc };
}

async function main() {
  setStatus("Opening saved data…", 0.02);
  await vfs.init();
  const manifest: { p: string; s: number }[] = await (await fetch("manifest.json")).json();
  const eager = manifest.filter((f) => !(/\.(mp3|ogg|wav|flac)$/i.test(f.p) && f.s > 600_000));
  const lazy = manifest.filter((f) => !eager.includes(f));
  for (const f of lazy) vfs.addLazy(f.p, f.p);
  const total = eager.reduce((s, f) => s + f.s, 0) || 1;
  let done = 0;
  const queue = [...eager];
  const worker = async () => {
    while (queue.length) {
      const f = queue.shift()!;
      const r = await fetch(f.p);
      if (!r.ok) { console.warn("missing asset", f.p); continue; }
      const b = new Uint8Array(await r.arrayBuffer());
      vfs.put(f.p, b, false);
      if (/\.(png|jpe?g|gif|bmp|webp)$/i.test(f.p)) {
        try { registerBitmap(f.p, await createImageBitmap(new Blob([b]), { premultiplyAlpha: "none", colorSpaceConversion: "none" } as any)); } catch (e) { console.warn("decode", f.p, e); }
      } else if (/\.(ttf|otf)$/i.test(f.p)) {
        const family = "rf_" + f.p.replace(/[^a-z0-9]/gi, "_");
        try { const face = new FontFace(family, b.slice().buffer); await face.load(); (document as any).fonts.add(face); registerFont(f.p, { family, ...ttfMetrics(b) }); } catch (e) { console.warn("font", f.p, e); }
      }
      done += f.s;
      setStatus(`Loading game files… ${Math.round((done / total) * 100)}%`, 0.05 + 0.9 * (done / total));
    }
  };
  await Promise.all(Array.from({ length: 6 }, worker));
  setStatus("Ready", 1);
  const start = document.getElementById("start") as HTMLButtonElement;
  start.hidden = false;
  start.focus();
  await new Promise<void>((res) => start.addEventListener("click", () => res(), { once: true }));
  document.getElementById("boot")!.remove();
  try { await document.documentElement.requestFullscreen?.(); } catch {}
  await import("./game-entry");
  installDrop();
}

function installDrop() {
  const mask = document.getElementById("dropmask")!;
  let depth = 0;
  addEventListener("dragenter", (e) => { e.preventDefault(); depth++; mask.hidden = false; });
  addEventListener("dragleave", () => { if (--depth <= 0) { depth = 0; mask.hidden = true; } });
  addEventListener("dragover", (e) => e.preventDefault());
  addEventListener("drop", async (e) => {
    e.preventDefault(); depth = 0; mask.hidden = true;
    const files = [...(e.dataTransfer?.files || [])].filter((f) => f.name.toLowerCase().endsWith(".sspm"));
    if (!files.length) return;
    const { Maps } = await import("../src/utils/maps");
    const { toastManager } = await import("../src/utils/toastManager");
    let ok = 0;
    for (const f of files) { try { if (await Maps.importBuffer(Buffer.from(await f.arrayBuffer()))) ok++; } catch (err) { console.error(err); } }
    try { (toastManager as any).show(`Imported ${ok}/${files.length} map${files.length > 1 ? "s" : ""}`); } catch {}
    const { state } = await import("../src/atoms/sysutils/state");
    const scene: any = state.currentScene;
    if (scene && scene.sceneName === "Menu") {
      // Same steps as the menu's own Import .sspm flow (switchToDownloaded).
      scene.currentTab = "Downloaded";
      try { scene.topBar.goToTab("Downloaded"); } catch {}
      scene.clearAllMaps();
      scene.allDownloadedBeatmaps = [];
      await scene.loadDownloadedMaps();
    }
  });
}

main().catch((e) => { setStatus("Could not start: " + (e?.message || e)); console.error(e); });
