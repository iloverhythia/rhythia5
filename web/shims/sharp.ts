import { Buffer } from "buffer";
import { vfs } from "./vfs";
// Minimal sharp: resize(cover/contain/fill) -> blur -> png/raw, implemented with OffscreenCanvas.
export default function sharp(input: any) {
  const ops: any = { w: 0, h: 0, fit: "cover", blur: 0, raw: false };
  const load = async () => {
    const bytes: Uint8Array = typeof input === "string" ? (await vfs.readAsync(input))! : new Uint8Array(input);
    if (!bytes) throw new Error("Input file is missing: " + input);
    return createImageBitmap(new Blob([bytes]));
  };
  const render = async () => {
    const bmp = await load();
    const w = ops.w || bmp.width, h = ops.h || bmp.height;
    const cv = new OffscreenCanvas(w, h); const g = cv.getContext("2d")! as any;
    let sx = 0, sy = 0, sw = bmp.width, sh = bmp.height;
    if (ops.fit === "cover" && ops.w && ops.h) { const s = Math.max(w / bmp.width, h / bmp.height); sw = w / s; sh = h / s; sx = (bmp.width - sw) / 2; sy = (bmp.height - sh) / 2; }
    if (ops.blur) { g.filter = `blur(${ops.blur}px)`; const pad = ops.blur * 3; g.drawImage(bmp, sx, sy, sw, sh, -pad, -pad, w + pad * 2, h + pad * 2); }
    else g.drawImage(bmp, sx, sy, sw, sh, 0, 0, w, h);
    return { cv, g, w, h };
  };
  const api: any = {
    resize(w: number, h?: number, o?: any) { ops.w = w; ops.h = h || w; if (o && o.fit) ops.fit = o.fit; return api; },
    blur(s?: number) { ops.blur = s || 1; return api; },
    raw() { ops.raw = true; return api; },
    png() { return api; }, jpeg() { return api; }, webp() { return api; }, toFormat() { return api; }, rotate() { return api; }, flatten() { return api; },
    async metadata() { const b = await load(); return { width: b.width, height: b.height, format: "png" }; },
    async toBuffer(o?: any) {
      const { cv, g, w, h } = await render();
      let buf: Buffer;
      if (ops.raw) buf = Buffer.from(g.getImageData(0, 0, w, h).data.buffer);
      else buf = Buffer.from(await (await cv.convertToBlob({ type: "image/png" })).arrayBuffer());
      return o && o.resolveWithObject ? { data: buf, info: { width: w, height: h, channels: 4, size: buf.length } } : buf;
    },
    async toFile(p: string) {
      const { cv, w, h } = await render();
      vfs.put(p, new Uint8Array(await (await cv.convertToBlob({ type: "image/png" })).arrayBuffer()));
      return { width: w, height: h, format: "png" };
    },
  };
  return api;
}
