import { DrawRectangle } from "raylib";
import {
  BaseNoteRenderer,
  NoteRenderConfig,
  NoteRenderState,
} from "../atoms/NoteRenderer";

export class BoxNoteRenderer extends BaseNoteRenderer {
  constructor(config: NoteRenderConfig) {
    super(config);
  }

  protected drawNote(state: NoteRenderState): void {
    const halfSize = state.size / 2;
    this.applyTransform(state.position);

    DrawRectangle(
      Math.round(-halfSize),
      Math.round(-halfSize),
      Math.round(state.size),
      Math.round(state.size),
      {
        r: state.color.r,
        g: state.color.g,
        b: state.color.b,
        a: Math.floor(state.alpha * 255),
      }
    );

    this.removeTransform();
  }
}
