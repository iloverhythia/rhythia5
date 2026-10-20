// md5 is what the game uses for cache file names.
function md5bytes(input: Uint8Array): string {
  const K = new Int32Array(64), S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
  const len = input.length, nBlocks = ((len + 8) >> 6) + 1, words = new Int32Array(nBlocks * 16);
  for (let i = 0; i < len; i++) words[i >> 2] |= input[i] << ((i % 4) * 8);
  words[len >> 2] |= 0x80 << ((len % 4) * 8);
  words[nBlocks * 16 - 2] = len * 8; words[nBlocks * 16 - 1] = Math.floor(len / 536870912);
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  for (let b = 0; b < nBlocks; b++) {
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F: number, g: number;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      const s = S[(i >> 4) * 4 + (i % 4)];
      const t = (A + F + K[i] + words[b * 16 + g]) | 0;
      A = D; D = C; C = B; B = (B + ((t << s) | (t >>> (32 - s)))) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  }
  let hex = "";
  for (const v of [a0, b0, c0, d0]) for (let i = 0; i < 4; i++) hex += ((v >>> (i * 8)) & 255).toString(16).padStart(2, "0");
  return hex;
}
const te = new TextEncoder();
export function createHash(_alg: string) {
  const parts: Uint8Array[] = [];
  const h = {
    update(d: any) { parts.push(typeof d === "string" ? te.encode(d) : new Uint8Array(d.buffer ? d.buffer.slice(d.byteOffset, d.byteOffset + d.byteLength) : d)); return h; },
    digest(enc?: string) {
      const n = parts.reduce((s, p) => s + p.length, 0), all = new Uint8Array(n); let o = 0; for (const p of parts) { all.set(p, o); o += p.length; }
      const hex = md5bytes(all);
      if (enc === "hex" || !enc) return hex;
      return hex;
    },
  };
  return h;
}
export const randomUUID = () => (globalThis.crypto as any).randomUUID();
export const randomBytes = (n: number) => { const b = new Uint8Array(n); globalThis.crypto.getRandomValues(b); return b; };
export default { createHash, randomUUID, randomBytes };
