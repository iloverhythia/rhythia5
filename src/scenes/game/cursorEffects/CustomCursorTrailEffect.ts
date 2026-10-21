import { Vector2 } from "raylib";
import { drawSprite } from "../../../utils/sprite";
import {
  registerCustomization,
  type GameSettingDefinition,
} from "../../../utils/settingsRegistry";
import { ConfigManager } from "../../../utils/configManager";
import { clamp } from "../../../utils/lerp";
import { CursorEffect, CursorEffectContext } from "./CursorEffect";

type RGB = { r: number; g: number; b: number };
export type TrailGradientPoint = [number, RGB];

interface TrailParticle {
  position: Vector2 | null;
  t: number;
  angle: number;
  color: RGB;
  alpha: number;
}

export const DEFAULT_TRAIL_GRADIENT: TrailGradientPoint[] = [
  [0, { r: 255, g: 255, b: 255 }],
  [1, { r: 195, g: 166, b: 204 }],
];

export const trailGradient = (): TrailGradientPoint[] =>
  ConfigManager.getExtra("trailGradient", DEFAULT_TRAIL_GRADIENT);

export function sampleTrailGradient(points: TrailGradientPoint[], x: number): RGB {
  const i = points.findIndex(([at]) => at >= x);
  if (i <= 0) return points[i < 0 ? points.length - 1 : 0][1];
  const [start, from] = points[i - 1];
  const [end, to] = points[i];
  const t = (x - start) / (end - start || 1);
  return {
    r: Math.round(from.r + (to.r - from.r) * t),
    g: Math.round(from.g + (to.g - from.g) * t),
    b: Math.round(from.b + (to.b - from.b) * t),
  };
}

registerCustomization(
  "CustomCursorTrailEffect",
  {
    id: "item-custom-cursor",
    name: "Custom Cursor",
    rarity: "Common",
    description: "",
    settingsCategory: "customCursor",
    iconPath: "/icon-custom-cursor.png",
  } as const,
  [
    {
      key: "customCursorEnabled",
      label: "Enabled",
      defaultValue: 1.0,
      min: 0.0,
      max: 1.0,
      step: 1.0,
      itemCategory: "customCursor",
    },
    {
      key: "customCursorOpacity",
      label: "Cursor Opacity",
      defaultValue: 1.0,
      min: 0.0,
      max: 1.0,
      step: 0.05,
      category: "Cursor",
      itemCategory: "customCursor",
    },
    {
      key: "customCursorRotationSpeed",
      label: "Rotation Speed",
      defaultValue: 380.0,
      min: 0.0,
      max: 720.0,
      step: 5.0,
      category: "Cursor",
      itemCategory: "customCursor",
    },
    {
      key: "customCursorTrailEnabled",
      label: "Image Trail",
      defaultValue: 0.0,
      min: 0.0,
      max: 1.0,
      step: 1.0,
      itemCategory: "customCursor",
    },
  ] as const satisfies readonly GameSettingDefinition[],
  { priority: 20 }
);

export class CustomCursorTrailEffect implements CursorEffect {
  private particles: TrailParticle[] = [];
  private previous: Vector2 | null = null;
  private smart = false;

  update(context: CursorEffectContext): void {
    const { config, cursorPosition, deltaTime } = context;
    const smart = (config.smartTrail ?? 0) >= 0.5;
    if ((config.customCursorTrailEnabled ?? 0) < 0.5 || smart !== this.smart) {
      this.particles = [];
      this.previous = null;
      this.smart = smart;
      if ((config.customCursorTrailEnabled ?? 0) < 0.5) return;
    }

    const detail = Math.max(2, Math.round(config.trailDetail ?? 10));
    const step = deltaTime / Math.max(config.trailTime ?? 0.15, 0.001);
    const spawn = (position: Vector2, t: number): TrailParticle => ({
      position,
      t,
      angle: config.customCursorCurrentAngle ?? 0,
      color: config.cursorTint ?? { r: 255, g: 255, b: 255 },
      alpha: (config.cursorOpacity ?? 1) * (config.trailOpacity ?? 1),
    });

    if (smart) {
      this.particles.forEach((particle) => (particle.t -= step));
      this.particles = this.particles.filter((particle) => particle.t > 0);
      if (this.previous) {
        const dx = this.previous.x - cursorPosition.x;
        const dy = this.previous.y - cursorPosition.y;
        const amount = Math.min(Math.ceil((detail * Math.hypot(dx, dy)) / 100), 120);
        for (let i = 0; i < amount; i++) {
          const v = i / amount;
          this.particles.push(
            spawn(Vector2(cursorPosition.x + dx * v, cursorPosition.y + dy * v), 1 - v * deltaTime)
          );
        }
      }
    } else {
      if (this.particles.length !== detail) {
        this.particles = Array.from({ length: detail }, (_, i) => ({
          ...spawn(cursorPosition, -i / (detail - 1)),
          position: null,
        }));
      }
      this.particles.forEach((particle) => {
        particle.t += step;
        if (particle.t >= 1) Object.assign(particle, spawn(cursorPosition, particle.t % 1));
      });
    }
    this.previous = cursorPosition;
  }

  render(context: CursorEffectContext): void {
    const { config } = context;
    const mode = config.trailFadeMode ?? 0;
    const gradient = (config.trailGradientEnabled ?? 0) >= 0.5 ? trailGradient() : null;
    const texture = config.customCursorTexturePath;

    this.particles.forEach((particle) => {
      if (!particle.position) return;
      const a = clamp(this.smart ? particle.t : particle.t - 0.2, 0, 1);
      const color = gradient
        ? sampleTrailGradient(gradient, this.smart ? 1 - particle.t : particle.t)
        : particle.color;
      const alpha = mode !== 1 ? a * 0.6 * (config.trailOpacity ?? 1) : particle.alpha;
      const size = 8 * config.cursorScale * (mode !== 2 ? a : 1);
      if (size <= 0 || alpha <= 0) return;
      drawSprite(
        texture ?? "/circle.png",
        particle.position,
        Vector2(size, size),
        { ...color, a: Math.round(255 * alpha) },
        texture ? `${texture}-custom-cursor-image` : undefined,
        !!texture,
        true,
        particle.angle,
        Vector2(size / 2, size / 2)
      );
    });
  }
}
