import type { GameMode } from "./index";

const SpinMode: GameMode = {
  id: "spin",
  name: "Spin",
  getNotes(map) {
    return map.notes.map(([time, x, y]) => {
      const angle = (time / 30000) * Math.PI * 2;
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      return [
        time,
        1 + (x - 1) * cos - (y - 1) * sin,
        1 + (x - 1) * sin + (y - 1) * cos,
      ] as [number, number, number];
    });
  },
};

export default SpinMode;
