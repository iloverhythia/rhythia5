import type { Vector2 } from "raylib";
import { ConfigManager } from "../../utils/configManager";
import {
  getGameSettingByKey,
  toGameConfigKey,
} from "../../utils/gameSettingsSchema";

export type Rect = { x: number; y: number; w: number; h: number };
export type RGB = { r: number; g: number; b: number };

export type SettingsRow =
  | { kind: "section"; label: string }
  | {
      kind: "slider";
      label: string;
      min: number;
      max: number;
      step: number;
      get: () => number;
      set: (value: number) => void;
      defaultValue?: number;
      maxLabel?: string;
      format?: (value: number) => string;
    }
  | {
      kind: "toggle";
      label: string;
      get: () => boolean;
      set: (value: boolean) => void;
      defaultValue?: boolean;
      onLabel?: string;
      offLabel?: string;
    }
  | {
      kind: "select";
      label: string;
      options: () => { id: string; label: string }[];
      get: () => string;
      set: (id: string) => void;
    }
  | {
      kind: "link";
      label: string;
      icon: string;
      page: string;
      value?: () => string;
      half?: boolean;
    }
  | {
      kind: "color";
      label: string;
      get: () => RGB;
      set: (color: RGB) => void;
      defaultValue?: RGB;
      opacity?: { get: () => number; set: (value: number) => void };
    }
  | { kind: "button"; label: string; onClick: () => void; half?: boolean }
  | {
      kind: "custom";
      height: () => number;
      draw: (rect: Rect, mouse: Vector2 | null) => void;
      click?: (rect: Rect, mouse: Vector2) => boolean;
    };

export interface SettingsPage {
  id: string;
  title: string;
  subtitle: string;
  icon?: string;
  group?: "General" | "Skinning";
  rows: () => SettingsRow[];
  drawPreview?: (rect: Rect) => void;
}

const pages = new Map<string, SettingsPage>();

export function registerSettingsPage(page: SettingsPage): void {
  pages.set(page.id, page);
}

export function getSettingsPage(id: string): SettingsPage | undefined {
  return pages.get(id);
}

export function listSettingsPages(): SettingsPage[] {
  return [...pages.values()];
}

export function gameSettingSlider(
  key: string,
  overrides: Partial<Extract<SettingsRow, { kind: "slider" }>> = {}
): SettingsRow {
  const def = getGameSettingByKey(key)!;
  const configKey = toGameConfigKey(key);
  return {
    kind: "slider",
    label: def.label,
    min: def.min,
    max: def.max,
    step: def.step,
    defaultValue: def.defaultValue,
    get: () => (ConfigManager.get() as any)[configKey] ?? def.defaultValue,
    set: (value) => ConfigManager.setGameSettings({ [key]: value }),
    ...overrides,
  };
}

export function gameSettingToggle(
  key: string,
  overrides: Partial<Extract<SettingsRow, { kind: "toggle" }>> = {}
): SettingsRow {
  const def = getGameSettingByKey(key)!;
  const configKey = toGameConfigKey(key);
  return {
    kind: "toggle",
    label: def.label,
    defaultValue: def.defaultValue > 0,
    get: () => ((ConfigManager.get() as any)[configKey] ?? def.defaultValue) > 0,
    set: (value) => ConfigManager.setGameSettings({ [key]: value ? 1 : 0 }),
    ...overrides,
  };
}

export const settingsNavigation = { open: (id: string): void => {} };
