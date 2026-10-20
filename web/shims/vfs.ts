// In-memory file system. public/ and shaders/ are served alongside the page (fetched at boot or lazily);
// everything the game writes (cache/, config.json, profile.json, ...) persists to IndexedDB.
const files = new Map<string, Uint8Array>();
const lazy = new Map<string, string>(); // path -> url
const dirs = new Set<string>([""]);
const mtimes = new Map<string, number>();
const dirty = new Set<string>();
const removed = new Set<string>();
let db: IDBDatabase | null = null;
let flushTimer: any = 0;

function norm(p: string): string {
  if (p == null) return "";
  let s = String(p).replace(/\\/g, "/");
  if (s.startsWith("file://")) s = s.slice(7);
  s = s.replace(/^\/app(\/|$)/, "").replace(/^[A-Za-z]:\//, "");
  const out: string[] = [];
  for (const part of s.split("/")) {
    if (!part || part === ".") continue;
    if (part === "..") out.pop(); else out.push(part);
  }
  return out.join("/");
}
function parentOf(p: string) { const i = p.lastIndexOf("/"); return i < 0 ? "" : p.slice(0, i); }
function ensureParents(p: string) { let d = parentOf(p); while (d && !dirs.has(d)) { dirs.add(d); d = parentOf(d); } dirs.add(""); }
const persistable = (p: string) => !p.startsWith("public/") && !p.startsWith("shaders/");

function schedule() {
  if (flushTimer) return;
  flushTimer = setTimeout(flushNow, 400);
}
function flushNow() {
  flushTimer = 0;
  if (!db) { dirty.clear(); removed.clear(); return; }
  try {
    const tx = db.transaction("files", "readwrite"); const st = tx.objectStore("files");
    for (const p of dirty) { const d = files.get(p); if (d) st.put({ p, d, t: mtimes.get(p) || Date.now() }); }
    for (const p of removed) st.delete(p);
    for (const d of dirs) if (persistable(d) && d) st.put({ p: d, dir: true });
  } catch (e) { console.warn("persist failed", e); }
  dirty.clear(); removed.clear();
}

export const vfs = {
  norm,
  async init() {
    await new Promise<void>((res) => {
      try {
        const q = indexedDB.open("rhythia-web-fs", 1);
        q.onupgradeneeded = () => q.result.createObjectStore("files", { keyPath: "p" });
        q.onsuccess = () => { db = q.result; res(); };
        q.onerror = () => res();
      } catch { res(); }
    });
    if (!db) return;
    await new Promise<void>((res) => {
      try {
        const q = db!.transaction("files").objectStore("files").getAll();
        q.onsuccess = () => {
          for (const r of q.result || []) {
            if (r.dir) { dirs.add(r.p); ensureParents(r.p + "/x"); }
            else { files.set(r.p, r.d); mtimes.set(r.p, r.t || Date.now()); ensureParents(r.p); }
          }
          res();
        };
        q.onerror = () => res();
      } catch { res(); }
    });
  },
  addLazy(p: string, url: string) { const k = norm(p); lazy.set(k, url); ensureParents(k); },
  put(p: string, data: Uint8Array, persist = true) {
    const k = norm(p); files.set(k, data); mtimes.set(k, Date.now()); ensureParents(k); lazy.delete(k);
    if (persist && persistable(k)) { dirty.add(k); removed.delete(k); schedule(); }
  },
  peek(p: string) { return files.get(norm(p)) || null; },
  has(p: string) { const k = norm(p); return files.has(k) || lazy.has(k); },
  isDir(p: string) { return dirs.has(norm(p)); },
  async readAsync(p: string): Promise<Uint8Array | null> {
    const k = norm(p);
    const f = files.get(k); if (f) return f;
    const url = lazy.get(k); if (!url) return null;
    const r = await fetch(url); if (!r.ok) return null;
    const b = new Uint8Array(await r.arrayBuffer()); files.set(k, b); lazy.delete(k); return b;
  },
  read(p: string): Uint8Array {
    const k = norm(p);
    const f = files.get(k);
    if (f) return f;
    if (lazy.has(k)) { const e: any = new Error(`EAGAIN: ${p} is still downloading`); e.code = "EAGAIN"; throw e; }
    const e: any = new Error(`ENOENT: no such file or directory, open '${p}'`); e.code = "ENOENT"; throw e;
  },
  mkdir(p: string) { const k = norm(p); if (!k) return; ensureParents(k + "/x"); dirs.add(k); if (persistable(k)) schedule(); },
  list(p: string): { name: string; dir: boolean }[] {
    const k = norm(p); const pre = k ? k + "/" : ""; const out = new Map<string, boolean>();
    const scan = (key: string, dir: boolean) => { if (key.startsWith(pre) && key !== k) { const rest = key.slice(pre.length); const i = rest.indexOf("/"); if (i < 0) out.set(rest, dir || out.get(rest) || false); else out.set(rest.slice(0, i), true); } };
    for (const f of files.keys()) scan(f, false);
    for (const f of lazy.keys()) scan(f, false);
    for (const d of dirs) if (d) scan(d, true);
    return [...out].map(([name, dir]) => ({ name, dir }));
  },
  remove(p: string) {
    const k = norm(p);
    if (files.delete(k) || lazy.delete(k)) { removed.add(k); dirty.delete(k); schedule(); return true; }
    return false;
  },
  rmdir(p: string) {
    const k = norm(p); const pre = k + "/";
    for (const f of [...files.keys()]) if (f.startsWith(pre)) { files.delete(f); removed.add(f); }
    for (const d of [...dirs]) if (d === k || d.startsWith(pre)) { dirs.delete(d); removed.add(d); }
    schedule();
  },
  rename(a: string, b: string) { const d = files.get(norm(a)); if (!d) return false; this.remove(a); this.put(b, d); return true; },
  mtime(p: string) { return mtimes.get(norm(p)) || 0; },
  size(p: string) { return files.get(norm(p))?.byteLength || 0; },
  flush: flushNow,
};
