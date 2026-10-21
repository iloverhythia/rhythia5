import {
  rlTranslatef,
  rlPushMatrix,
  rlPopMatrix,
  rlRotatef,
  rlDisableBackfaceCulling,
  rlEnableBackfaceCulling,
  Vector2,
  Vector3,
} from "raylib";
import { drawSprite } from "../../../utils/sprite";
import { drawBorderRect } from "../../../ui/draw";
import { Rhythia } from "../../../atoms/Rhythia";
import { noteColorManager } from "../../../utils/noteColorPalette";
import { NoteHitResult } from "./NoteHitDetector";

export interface NoteRenderConfig {
  squareScale: number;
  noteMaxOpacity: number;
  halfGhost?: boolean;
  halfGhostStrength?: number;
  spin?: { x: number; y: number; z: number };
  spawnEffect?: boolean;
  approachSquares?: boolean;
  approachFollow?: boolean;
}

export interface NoteRenderer {
  renderNote(
    note: [number, number, number],
    msTime: number,
    approachRate: number,
    approachDistance: number,
    fadeIn: number,
    fadeOut: boolean,
    pushback: boolean,
    speed: number,
    hitResult: NoteHitResult,
    noteIndex?: number
  ): void;

  updateConfig(config: Partial<NoteRenderConfig>): void;
}

export interface NoteRenderState {
  depth: number;
  alpha: number;
  size: number;
  position: Vector3;
  color: { r: number; g: number; b: number };
}

export abstract class BaseNoteRenderer implements NoteRenderer {
  protected config: NoteRenderConfig;

  protected constructor(config: NoteRenderConfig) {
    this.config = { ...config };
  }

  public renderNote(
    note: [number, number, number],
    msTime: number,
    approachRate: number,
    approachDistance: number,
    fadeIn: number,
    fadeOut: boolean,
    pushback: boolean,
    speed: number,
    hitResult: NoteHitResult,
    noteIndex: number = 0
  ): void {
    const state = this.getRenderState(
      note,
      msTime,
      approachRate,
      approachDistance,
      fadeIn,
      fadeOut,
      pushback,
      speed,
      hitResult,
      noteIndex
    );

    if (!hitResult.missed) {
      this.drawApproachEffects(state, approachDistance);
    }

    if (state.alpha <= 0) {
      return;
    }

    const spin = this.config.spin;
    if (!spin || (!spin.x && !spin.y && !spin.z)) {
      this.drawNote(state);
      return;
    }
    const age = (approachDistance - state.depth) / approachRate;
    const { x, y, z } = state.position;
    rlPushMatrix();
    rlTranslatef(x, y, z);
    rlRotatef(spin.x * age, 1, 0, 0);
    rlRotatef(spin.y * age, 0, 1, 0);
    rlRotatef(spin.z * age, 0, 0, 1);
    rlTranslatef(-x, -y, -z);
    rlDisableBackfaceCulling();
    this.drawNote(state);
    rlEnableBackfaceCulling();
    rlPopMatrix();
  }

  private drawApproachEffects(state: NoteRenderState, approachDistance: number): void {
    const progress = Math.min(1, Math.max(0, state.depth / approachDistance));
    const { x, y, z } = state.position;
    const spawn = 1 - Math.min(1, Math.max(0, 4 * (1 - progress)));
    if (this.config.spawnEffect && spawn > 0) {
      const width = 80 * this.config.squareScale * spawn;
      const height = 900 * this.config.squareScale * (0.9 + 0.1 * spawn);
      rlPushMatrix();
      rlTranslatef(x, y, z);
      drawSprite("/notefx/spawn_effect.png", Vector2(-width / 2, -height), Vector2(width, height), { ...state.color, a: 255 });
      rlPopMatrix();
    }
    if (this.config.approachSquares) {
      const size = 335 * (progress + 0.6) * 0.4;
      rlPushMatrix();
      rlTranslatef(x, y, this.config.approachFollow ? z : 0);
      drawBorderRect(-size / 2, -size / 2, size, size, Math.max(1, size / 73), {
        r: 255,
        g: 255,
        b: 255,
        a: Math.round(255 * Math.pow(1 - progress, 1.7)),
      });
      rlPopMatrix();
    }
  }

  public updateConfig(config: Partial<NoteRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  public drawPreview(position: Vector3, size: number, color: NoteRenderState["color"]): void {
    this.drawNote({ depth: 0, alpha: 1, size, position, color });
  }

  protected abstract drawNote(state: NoteRenderState): void;

  protected getNoteSize(): number {
    return 100 * this.config.squareScale;
  }

  protected getNotePosition(note: [number, number, number], depth: number): Vector3 {
    const planeX = note[1] - 1;
    const planeY = note[2] - 1;
    const planeZ = depth * 100;

    return Vector3(
      Rhythia.gameWidth / 2 + planeX * 100,
      Rhythia.gameHeight / 2 + planeY * 100,
      planeZ
    );
  }

  protected applyTransform(position: Vector3): void {
    rlPushMatrix();
    rlTranslatef(position.x, position.y, position.z);
  }

  protected removeTransform(): void {
    rlPopMatrix();
  }

  private getRenderState(
    note: [number, number, number],
    msTime: number,
    approachRate: number,
    approachDistance: number,
    fadeIn: number,
    fadeOut: boolean,
    pushback: boolean,
    speed: number,
    hitResult: NoteHitResult,
    noteIndex: number
  ): NoteRenderState {
    const approachTime = approachDistance / approachRate;
    const depth =
      (((note[0] - msTime) / (1000 * approachTime)) * approachDistance) / speed;

    let alpha = Math.max(
      0,
      Math.min(1, (1 - depth / approachDistance) / (fadeIn / 100))
    );

    if (fadeOut) {
      if (depth <= 0) {
        const fadeProgress = Math.abs(depth) / (approachDistance * 0.05);
        alpha = alpha * Math.max(0, 1 - Math.pow(fadeProgress, 0.5));
      } else if (depth < approachDistance * 0.2) {
        const fadeProgress =
          (approachDistance * 0.2 - depth) / (approachDistance * 0.2);
        alpha = alpha * (1 - fadeProgress * 0.1);
      }
    }

    if (!pushback && note[0] - msTime <= 0) {
      alpha = 0;
    }

    alpha = Math.min(1, Math.max(0, alpha));

    if (hitResult.missed) {
      alpha = alpha * hitResult.opacity;
    }

    
    const maxOpacity = Math.min(1, Math.max(0, this.config.noteMaxOpacity ?? 1.0));
    alpha = Math.min(alpha, maxOpacity);

    if (this.config.halfGhost) {
      const strength = this.config.halfGhostStrength ?? 0.8;
      alpha *= 1 - strength + strength * Math.min(1, Math.max(0, (depth / approachDistance - 0.2) / 0.3));
    }

    const size = this.getNoteSize();
    const position = this.getNotePosition(note, depth);
    const color = noteColorManager.getColorForNoteIndex(noteIndex);

    return {
      depth,
      alpha,
      size,
      position,
      color,
    };
  }
}
