import { Vector2, Color, ColorFromHSV, rlTranslatef } from "raylib";
import { GameSettings } from "../../../utils/settingsRegistry";
import {
  UIDecoration,
  UIDecorationContext,
} from "../panel-decorations/UIDecoration";
import { drawSprite } from "../../../utils/sprite";
import { ConfigManager } from "../../../utils/configManager";

export interface GameUIPanelCommonArgs {
  closeDistance: number;
  cameraTiltX: number;
  cameraTiltY: number;
  settings?: Partial<GameSettings>;
  decorations: UIDecoration[];
  decorationContext: UIDecorationContext;
}

export const UI_COLOR_DEFAULTS = {
  panelBg: "#9b000000",
  panelText: "#ffffff",
  scoreTextColor: "#ffffff",
  pauseUiOpacity: 0.75,
  unpauseEmptyColor: "#68ff00",
  unpauseFillColor: "#80fff3",
  howToQuit: "#ffdb00",
  comboFillColor: "#7bfff3",
  comboEmptyColor: "#b94b4b4b",
  accFillColor: "#8cff00",
  accEmptyColor: "#b08f8f8f",
  energyFillColor: "#3aa515",
  energyEmptyColor: "#af942121",
  timerText: "#ffffff",
  timerTextDone: "#77ff77",
  timerTextCanskip: "#b3ffff",
  timerFg: "#ffffff",
  timerBg: "#af8f8f8f",
  timerFgDone: "#25bf00",
  timerBgDone: "#af008f00",
  timerFgCanskip: "#b3ffff",
  timerBgCanskip: "#b0638f8f",
  missTextColor: "#ffffff",
  missFlashColor: "#ff0000",
  pauseTextColor: "#ffffff",
  pauseUsedColor: "#ff66ff",
  gradeSsSaturation: 0.4,
  gradeSsValue: 1,
  gradeSColor: "#91fffa",
  gradeAColor: "#91ff92",
  gradeBColor: "#e7ffc0",
  gradeCColor: "#fcf7b3",
  gradeDColor: "#fcd0b3",
  gradeFColor: "#ff8282",
};

type UIColorDefaults = typeof UI_COLOR_DEFAULTS;
export type UISettingKey = keyof UIColorDefaults;
export type UIColorKey = { [K in UISettingKey]: UIColorDefaults[K] extends string ? K : never }[UISettingKey];

export const parseHexColor = (hex: string): Color => {
  const n = parseInt(hex.slice(1), 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255, a: hex.length > 7 ? n >>> 24 : 255 };
};

export const toHexColor = ({ r, g, b, a }: Color): string =>
  "#" + [a, r, g, b].map((v) => Math.round(v).toString(16).padStart(2, "0")).join("");

export const uiSetting = <K extends UISettingKey>(key: K): UIColorDefaults[K] =>
  ConfigManager.getExtra(`ui.${key}`, UI_COLOR_DEFAULTS[key]);

export const uiColor = (key: UIColorKey, alpha = 255): Color => {
  const color = parseHexColor(uiSetting(key));
  return { ...color, a: Math.round((color.a * alpha) / 255) };
};

export const rainbowHue = (): number => (Date.now() * 0.018) % 360;

export abstract class GameUIPanel<Args extends GameUIPanelCommonArgs> {
  abstract render(args: Args): void;

  protected color(key: UIColorKey, alpha: number): Color {
    const color = uiColor(key, alpha);
    if (!ConfigManager.get().gameRainbowHud) return color;
    const gray = Math.max(color.r, color.g, color.b) / 255;
    const tint = ColorFromHSV(rainbowHue(), 0.4, 1);
    return { r: Math.round(tint.r * gray), g: Math.round(tint.g * gray), b: Math.round(tint.b * gray), a: color.a };
  }

  protected applyTilt(args: GameUIPanelCommonArgs, attachedToGrid = false): void {
    const settings = args.settings ?? {};
    const shift = attachedToGrid
      ? (-(settings.gridParallax ?? 1) * 100) / (settings.tiltAmount || 1)
      : 100 * (1 - (settings.uiTiltRate ?? 1));
    rlTranslatef(args.cameraTiltX * shift, args.cameraTiltY * shift, 0);
  }

  protected drawBackground(width: number, height: number, uiOpacity: number): void {
    drawSprite("/solid.png", Vector2(-width / 2, -height / 2), Vector2(width, height), this.color("panelBg", 255 * uiOpacity * 5));
  }
}
