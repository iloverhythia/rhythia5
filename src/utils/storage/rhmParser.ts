import { Buffer } from "buffer";
import { createHash } from "crypto";
import { inflateRaw } from "zlib";

export interface RHMMap {
  id: string;
  title: string;
  mappers: string[];
  difficulty: number;
  customDifficultyName?: string;
  notes: [number, number, number][];
  audio?: Buffer;
  cover?: Buffer;
}

const inflate = (data: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    inflateRaw(data, (error, result) => (error ? reject(error) : resolve(result)))
  );

export function isRHM(bytes: Buffer): boolean {
  return bytes.length > 4 && bytes.readUInt32LE(0) === 0x04034b50;
}

export async function parseRHM(bytes: Buffer): Promise<RHMMap> {
  const end = bytes.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  const entries = new Map<string, Buffer>();
  let offset = bytes.readUInt32LE(end + 16);
  for (let i = 0; i < bytes.readUInt16LE(end + 10); i++) {
    const method = bytes.readUInt16LE(offset + 10);
    const size = bytes.readUInt32LE(offset + 20);
    const nameLength = bytes.readUInt16LE(offset + 28);
    const local = bytes.readUInt32LE(offset + 42);
    const start =
      local + 30 + bytes.readUInt16LE(local + 26) + bytes.readUInt16LE(local + 28);
    const data = bytes.subarray(start, start + size);
    entries.set(
      bytes.toString("utf8", offset + 46, offset + 46 + nameLength),
      method === 8 ? await inflate(data) : data
    );
    offset +=
      46 + nameLength + bytes.readUInt16LE(offset + 30) + bytes.readUInt16LE(offset + 32);
  }

  const map = JSON.parse(entries.get("map")!.toString("utf8"));
  return {
    id: String(map.OnlineId ?? createHash("md5").update(bytes).digest("hex")),
    title: map.Title || map.SongName || "Unknown",
    mappers: map.Mappers ?? [],
    difficulty: map.Difficulty ?? 0,
    customDifficultyName: map.CustomDifficultyName || undefined,
    notes: (map.Notes as { Time: number; X: number; Y: number }[])
      .map((note): [number, number, number] => [note.Time, note.X, note.Y])
      .sort((a, b) => a[0] - b[0]),
    audio: entries.get("audio"),
    cover: entries.get("cover"),
  };
}
