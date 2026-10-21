import type { GameMode } from "./index";
import type { NoteRenderer } from "../atoms/NoteRenderer";

const GhostMode: GameMode = {
  id: "ghost",
  name: "Ghost",
  provideNoteRenderer(renderer: NoteRenderer): NoteRenderer {
    let maxOpacity = 1;
    return {
      updateConfig(config) {
        maxOpacity = config.noteMaxOpacity ?? maxOpacity;
        renderer.updateConfig(config);
      },
      renderNote(...args: Parameters<NoteRenderer["renderNote"]>) {
        const [note, msTime, approachRate, approachDistance, , , , speed] = args;
        const progress =
          ((note[0] - msTime) * approachRate) / (1000 * approachDistance * speed);
        renderer.updateConfig({
          noteMaxOpacity: maxOpacity * Math.min(1, Math.max(0, (progress - 0.2) / 0.3)),
        });
        renderer.renderNote(...args);
      },
    };
  },
};

export default GhostMode;
