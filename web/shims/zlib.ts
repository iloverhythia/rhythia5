import { Buffer } from "buffer";

export function inflateRaw(data: Uint8Array, callback: (error: Error | null, result: Buffer) => void): void {
  new Response(new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw")))
    .arrayBuffer()
    .then((result) => callback(null, Buffer.from(result)), (error) => callback(error, Buffer.alloc(0)));
}

export default { inflateRaw };
