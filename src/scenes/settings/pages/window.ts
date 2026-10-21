import { GetScreenHeight, GetScreenWidth } from "raylib";
import { registerSettingsPage } from "../pages";
import { ConfigManager } from "../../../utils/configManager";
import { applyWindowSettings } from "../../../atoms/sysutils/window";

const RESOLUTIONS = ["1280x720", "1366x768", "1600x900", "1920x1080", "2560x1440", "3840x2160"];
const MODES = { windowed: "Windowed", borderless: "Borderless", fullscreen: "Fullscreen" };

const apply = (key: string, value: unknown) => {
  ConfigManager.setExtra(key, value);
  applyWindowSettings();
};

registerSettingsPage({
  id: "window",
  title: "Window Settings",
  subtitle: "Resolution, window mode, and renderer",
  icon: "/icons/app-window.png",
  rows: () => {
    const current = `${GetScreenWidth()}x${GetScreenHeight()}`;
    return [
      {
        kind: "select",
        label: "Resolution",
        options: () => [...new Set([current, ...RESOLUTIONS])].map((id) => ({ id, label: id })),
        get: () => current,
        set: (id) => apply("resolution", id),
      },
      {
        kind: "select",
        label: "Window Mode",
        options: () => Object.entries(MODES).map(([id, label]) => ({ id, label })),
        get: () => ConfigManager.getExtra("windowMode", "windowed"),
        set: (id) => apply("windowMode", id),
      },
      {
        kind: "toggle",
        label: "VSync",
        get: () => ConfigManager.getExtra("vsync", false),
        set: (value) => apply("vsync", value),
      },
      {
        kind: "toggle",
        label: "Minimize on Alt-Tab",
        get: () => ConfigManager.getExtra("minimizeOnAltTab", false),
        set: (value) => ConfigManager.setExtra("minimizeOnAltTab", value),
      },
    ];
  },
});
