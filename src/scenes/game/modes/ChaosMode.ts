import type { GameMode } from "./index";

const ChaosMode: GameMode = {
  id: "chaos",
  name: "Chaos",
  getNotes(map) {
    let seed = Array.from(map.id).reduce(
      (hash, char) => Math.imul(hash ^ char.charCodeAt(0), 16777619),
      2166136261
    );
    const random = () => {
      seed = (seed + 0x6d2b79f5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), seed | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
    return map.notes.map(
      ([time]) => [time, random() * 2, random() * 2] as [number, number, number]
    );
  },
};

export default ChaosMode;
