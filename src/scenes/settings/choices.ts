import * as fs from "fs";
import * as path from "path";
import { openDialog } from "nativefiledialog";
import { ConfigManager } from "../../utils/configManager";
import {
  getGameSettingByKey,
  toGameConfigKey,
} from "../../utils/gameSettingsSchema";
import type { RGB, SettingsRow } from "./pages";

export function gameSettingValue(key: string): number {
  return (
    (ConfigManager.get() as any)[toGameConfigKey(key)] ??
    getGameSettingByKey(key)!.defaultValue
  );
}

export function gameSettingColor(
  label: string,
  [r, g, b]: [string, string, string],
  overrides: Partial<Extract<SettingsRow, { kind: "color" }>> = {}
): SettingsRow {
  const color = (value: (key: string) => number): RGB => ({
    r: value(r),
    g: value(g),
    b: value(b),
  });
  return {
    kind: "color",
    label,
    get: () => color(gameSettingValue),
    set: (c) => ConfigManager.setGameSettings({ [r]: c.r, [g]: c.g, [b]: c.b }),
    defaultValue: color((key) => getGameSettingByKey(key)!.defaultValue),
    ...overrides,
  };
}

export function choiceRows(
  options: { id: string; label: string }[],
  get: () => string,
  set: (id: string) => void
): SettingsRow[] {
  return options.map(({ id, label }) => ({
    kind: "toggle",
    label,
    get: () => get() === id,
    set: () => set(id),
    onLabel: "Selected",
    offLabel: "",
  }));
}

export function fileLabel(file: string): string {
  return path.parse(file).name;
}

function appDataFolder(folder: string): string {
  const dir = path.join(ConfigManager.getAppDataDir(), folder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function listImported(
  folder: string,
  current = ""
): { id: string; label: string }[] {
  const dir = appDataFolder(folder);
  const files: string[] = fs
    .readdirSync(dir)
    .map((name: string) => path.join(dir, name));
  if (current && !files.includes(current)) files.push(current);
  return files.map((id) => ({ id, label: fileLabel(id) }));
}

export function pickFileButton(
  label: string,
  filter: Record<string, string>,
  onPicked: (file: string) => void,
  folder?: string
): SettingsRow {
  return {
    kind: "button",
    label,
    onClick: () => {
      const picked: string = openDialog(filter as any);
      if (!picked) return;
      const target = folder
        ? path.join(appDataFolder(folder), path.basename(picked))
        : picked;
      if (folder) fs.copyFileSync(picked, target);
      onPicked(target);
    },
  };
}
