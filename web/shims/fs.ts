import { Buffer } from "buffer";
import { vfs } from "./vfs";

const enc = new TextEncoder();
const dec = new TextDecoder();
const toBytes = (d: any): Uint8Array =>
  typeof d === "string" ? enc.encode(d) : d instanceof Uint8Array ? new Uint8Array(d) : d instanceof ArrayBuffer ? new Uint8Array(d) : ArrayBuffer.isView(d) ? new Uint8Array(d.buffer, d.byteOffset, d.byteLength) : enc.encode(String(d));
const encodingOf = (o: any) => (typeof o === "string" ? o : o && o.encoding) || null;

class Dirent { constructor(public name: string, private d: boolean) {} isFile() { return !this.d; } isDirectory() { return this.d; } isSymbolicLink() { return false; } }
function mkStat(p: string) {
  const dir = vfs.isDir(p) && !vfs.peek(p);
  const t = vfs.mtime(p) || Date.now();
  return { isFile: () => !dir, isDirectory: () => dir, isSymbolicLink: () => false, size: vfs.size(p), mtimeMs: t, mtime: new Date(t), ctimeMs: t, ctime: new Date(t), birthtimeMs: t, birthtime: new Date(t), atime: new Date(t) };
}
function enoent(p: string, op = "open") { const e: any = new Error(`ENOENT: no such file or directory, ${op} '${p}'`); e.code = "ENOENT"; return e; }

export function existsSync(p: any) { return vfs.has(p) || vfs.isDir(p); }
export function readFileSync(p: any, o?: any): any {
  const b = vfs.read(p);
  const e = encodingOf(o);
  return e ? dec.decode(b) : Buffer.from(b.buffer, b.byteOffset, b.byteLength);
}
export function writeFileSync(p: any, d: any) { vfs.put(p, toBytes(d)); }
export function appendFileSync(p: any, d: any) {
  const old = vfs.peek(p) || new Uint8Array(0); const add = toBytes(d); const n = new Uint8Array(old.length + add.length); n.set(old); n.set(add, old.length); vfs.put(p, n);
}
export function mkdirSync(p: any) { vfs.mkdir(p); return undefined; }
export function readdirSync(p: any, o?: any): any {
  if (!vfs.isDir(p)) throw enoent(p, "scandir");
  const l = vfs.list(p);
  return o && o.withFileTypes ? l.map((e) => new Dirent(e.name, e.dir)) : l.map((e) => e.name);
}
export function statSync(p: any, o?: any) { if (!existsSync(p)) { if (o && o.throwIfNoEntry === false) return undefined; throw enoent(p, "stat"); } return mkStat(p); }
export const lstatSync = statSync;
export function unlinkSync(p: any) { if (!vfs.remove(p)) throw enoent(p, "unlink"); }
export function rmSync(p: any, o?: any) { if (vfs.isDir(p) && !vfs.peek(p)) vfs.rmdir(p); else if (!vfs.remove(p) && !(o && o.force)) throw enoent(p, "rm"); }
export function rmdirSync(p: any) { vfs.rmdir(p); }
export function renameSync(a: any, b: any) { if (!vfs.rename(a, b)) throw enoent(a, "rename"); }
export function copyFileSync(a: any, b: any) { vfs.put(b, new Uint8Array(vfs.read(a))); }
export function accessSync(p: any) { if (!existsSync(p)) throw enoent(p, "access"); }
export function realpathSync(p: any) { return p; }
export function openSync() { return 3; }
export function closeSync() {}
export function watch() { return { close() {}, on() { return this; } }; }
export function createWriteStream(p: any) {
  return { write(d: any) { appendFileSync(p, d); return true; }, end() {}, on() { return this; }, once() { return this; }, close() {} };
}
export const constants = { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 };

const wrap = <T>(fn: () => T) => new Promise<T>((res, rej) => { try { res(fn()); } catch (e) { rej(e); } });
async function readFileP(p: any, o?: any) {
  const b = await vfs.readAsync(p);
  if (!b) throw enoent(p);
  const e = encodingOf(o);
  return e ? dec.decode(b) : Buffer.from(b.buffer, b.byteOffset, b.byteLength);
}
export const promises = {
  readFile: readFileP,
  writeFile: (p: any, d: any) => wrap(() => writeFileSync(p, d)),
  appendFile: (p: any, d: any) => wrap(() => appendFileSync(p, d)),
  mkdir: (p: any) => wrap(() => mkdirSync(p)),
  readdir: (p: any, o?: any) => wrap(() => readdirSync(p, o)),
  stat: (p: any) => wrap(() => statSync(p)),
  lstat: (p: any) => wrap(() => statSync(p)),
  unlink: (p: any) => wrap(() => unlinkSync(p)),
  rm: (p: any, o?: any) => wrap(() => rmSync(p, o)),
  rmdir: (p: any) => wrap(() => rmdirSync(p)),
  rename: (a: any, b: any) => wrap(() => renameSync(a, b)),
  copyFile: (a: any, b: any) => wrap(() => copyFileSync(a, b)),
  access: (p: any) => wrap(() => accessSync(p)),
};
const cb = (fn: (...a: any[]) => Promise<any>) => (...args: any[]) => {
  const done = typeof args[args.length - 1] === "function" ? args.pop() : null;
  fn(...args).then((r) => done && done(null, r), (e) => done && done(e));
};
export const readFile = cb(promises.readFile);
export const writeFile = cb(promises.writeFile);
export const mkdir = cb(promises.mkdir);
export const readdir = cb(promises.readdir);
export const stat = cb(promises.stat);
export const unlink = cb(promises.unlink);
export const access = cb(promises.access);
export const rename = cb(promises.rename);
export const copyFile = cb(promises.copyFile);
export const appendFile = cb(promises.appendFile);
export const rm = cb(promises.rm);
export const exists = (p: any, done: any) => done(existsSync(p));

export default {
  existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, readdirSync, statSync, lstatSync, unlinkSync, rmSync, rmdirSync,
  renameSync, copyFileSync, accessSync, realpathSync, openSync, closeSync, watch, createWriteStream, constants, promises,
  readFile, writeFile, mkdir, readdir, stat, unlink, access, rename, copyFile, appendFile, rm, exists,
};
