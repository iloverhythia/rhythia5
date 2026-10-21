import type { GameMode } from "./index";
import type { HealthModel } from "../health/HealthModel";
import { SoundSpaceHealthModel } from "../health/SoundSpaceHealthModel";

const SuddenDeathMode: GameMode = {
  id: "sudden_death",
  name: "Sudden Death",
  createHealthModel(base?: HealthModel): HealthModel {
    const inner = base ?? new SoundSpaceHealthModel();
    let dead = false;
    return {
      getCurrentHealth: () => (dead ? 0 : inner.getCurrentHealth()),
      onNoteHit: () => inner.onNoteHit(),
      onNoteMiss: () => {
        dead = true;
      },
      reset: () => {
        dead = false;
        inner.reset();
      },
      getMaxHealth: () => inner.getMaxHealth(),
    };
  },
};

export default SuddenDeathMode;
