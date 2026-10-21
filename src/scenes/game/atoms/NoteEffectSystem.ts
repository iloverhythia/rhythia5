import {
  Color,
  ColorFromHSV,
  GetTime,
  Vector2,
  rlPopMatrix,
  rlPushMatrix,
  rlRotatef,
  rlTranslatef,
} from "raylib";
import { drawSprite } from "../../../utils/sprite";
import { drawText } from "../../../utils/text";

export const NOTE_EFFECTS = [
  { id: "burst", label: "Burst" },
  { id: "cross", label: "Cross" },
  { id: "ssp_ripple", label: "Ripple* (no color)" },
  { id: "ssp_ripple_n", label: "Ripple* (note color)" },
  { id: "ssp_ripple_r", label: "Ripple* (rainbow)" },
  { id: "ssp_shards", label: "Shards (note color)" },
  { id: "ssp_shards_r", label: "Shards (rainbow)" },
  { id: "ssp_shards_w", label: "Shards (no color)" },
  { id: "ssp_miss", label: "Miss* (red)" },
  { id: "ssp_miss_n", label: "Miss* (note color)" },
  { id: "ssp_miss_r", label: "Miss* (rainbow)" },
  { id: "ssp_miss_w", label: "Miss* (no color)" },
];

interface Effect {
  kind: string;
  image: string;
  external: boolean;
  x: number;
  y: number;
  vx: number;
  vy: number;
  age: number;
  life: number;
  color: Color;
  text: string;
}

const WHITE = { r: 255, g: 255, b: 255, a: 255 };

export class NoteEffectSystem {
  private effects: Effect[] = [];

  public spawn(id: string, x: number, y: number, noteColor: Color, image: string): void {
    const [, kind, variant] = id.split("_");
    const base = kind === "ripple" ? { ...WHITE, a: 115 } : kind === "miss" ? { r: 255, g: 70, b: 70, a: 255 } : noteColor;
    const custom = kind !== "shards" && !!image;
    const effect: Effect = {
      kind,
      image: custom ? image : `/notefx/${kind === "shards" ? "shard" : kind}.png`,
      external: custom,
      x,
      y,
      vx: 0,
      vy: 0,
      age: 0,
      life: kind === "ripple" ? 0.15 : 0.65,
      color: variant === "n" ? noteColor : variant === "w" ? WHITE : variant === "r" ? ColorFromHSV((GetTime() * 18) % 360, 0.4, 1) : base,
      text: "",
    };
    if (kind !== "shards") {
      this.effects.push(effect);
      return;
    }
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 400 * (1 - Math.random() * 0.35) * Math.sin((Math.random() * 35 * Math.PI) / 180);
      this.effects.push({
        ...effect,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0.4 * (1 - Math.random() * 0.2),
      });
    }
  }

  public spawnScore(x: number, y: number, color: Color, score: number): void {
    this.effects.push({
      kind: "score",
      image: "",
      external: false,
      x,
      y,
      vx: 0,
      vy: 0,
      age: 0,
      life: 1 / 3,
      color,
      text: `${score > 0 ? "+" : ""}${score.toLocaleString("en-US")}`,
    });
  }

  public update(deltaTimeMs: number): void {
    const dt = deltaTimeMs / 1000;
    this.effects = this.effects.filter((e) => {
      e.age += dt;
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      return e.age < e.life;
    });
  }

  public render(opacity: number, textAngle: number = 0): void {
    for (const e of this.effects) {
      const p = e.age / e.life;
      if (e.kind === "score") {
        const y = e.y + 40 * Math.min(1, Math.max(-1, 2 * Math.pow(p - 0.25, 2) - 0.125));
        rlPushMatrix();
        rlTranslatef(e.x, y, 0);
        rlRotatef(textAngle, 0, 0, 1);
        drawText(e.text, Vector2(1, 1), 18, { r: 0, g: 0, b: 0, a: Math.round(153 * (1 - p) * opacity) }, "center");
        drawText(e.text, Vector2(0, 0), 18, { ...e.color, a: Math.round(128 * (1 - p) * opacity) }, "center");
        rlPopMatrix();
        continue;
      }
      const alpha =
        e.kind === "ripple"
          ? 0.3 * (1 - p)
          : e.kind === "miss"
            ? p < 0.3375 ? 0.88 - (0.37 * p) / 0.3375 : (0.51 * (1 - p)) / 0.6625
            : p < 0.607 ? 1 - (0.667 * p) / 0.607 : (0.333 * (1 - p)) / 0.393;
      const scale = e.kind === "shards" ? (p < 0.218 ? p / 0.218 : (1 - p) / 0.782) : 1;
      const size =
        e.kind === "ripple"
          ? Vector2(100 * (0.36 + 0.36 * p), 100 * (0.36 + 0.36 * p))
          : e.kind === "miss"
            ? Vector2(40, 40)
            : Vector2(16 * scale, 4 * scale);
      drawSprite(
        e.image,
        Vector2(e.x, e.y),
        size,
        { ...e.color, a: Math.round(e.color.a * alpha * opacity) },
        undefined,
        e.external,
        true,
        (Math.atan2(e.vy, e.vx) * 180) / Math.PI,
        Vector2(size.x / 2, size.y / 2)
      );
    }
  }
}
