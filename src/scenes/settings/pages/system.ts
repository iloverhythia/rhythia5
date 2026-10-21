import { Vector2 } from "raylib";
import { exec } from "child_process";
import { registerSettingsPage, gameSettingSlider, gameSettingToggle } from "../pages";
import { ConfigManager } from "../../../utils/configManager";
import { Rhythia } from "../../../atoms/Rhythia";
import { PANEL } from "../../menu/atoms/BaseDrawer";
import { drawPanel } from "../../../ui/draw";
import { drawSprite } from "../../../utils/sprite";
import { drawText } from "../../../utils/text";
import { inRect } from "../../../utils/geometry";
import { gameSettingValue } from "../choices";
import { ModeManager } from "../../game/modes";

const CAMERA_PRESET_KEYS = ["tiltAmount", "uiTiltRate", "gridParallax", "spinCamera", "farawayHud"];
const CAMERA_PRESETS: Record<string, number[]> = {
  "Half-lock": [7.2, 1.2, 0, 0, 0],
  "Full-lock": [0, 1, 0, 0, 0],
  "Reverse-lock": [7.2, 0.8, 0, 0, 0],
  Spin: [7.2, 1, 0, 1, 1],
  "Half-lock (faraway)": [7.2, 1, 0, 0, 1],
  "Full-lock (faraway)": [0, 1, 0, 0, 1],
  "Reverse-lock (faraway)": [7.2, 1, 0, 0, 1],
  "Spin-lock (mid-pivot)": [0, 1, -21.5, 1, 1],
};

registerSettingsPage({
  id: "system",
  title: "System",
  subtitle: "Core gameplay settings",
  icon: "/icons/settings-2.png",
  group: "General",
  rows: () => [
    { kind: "section", label: "General" },
    { kind: "link", label: "Window Settings", icon: "/icons/app-window.png", page: "window" },
    {
      kind: "custom",
      height: () => 78,
      draw: (rect, mouse) => {
        const centerY = rect.y + rect.h / 2;
        const hovered = !!mouse && inRect(mouse.x, mouse.y, rect.x, rect.y, rect.w, rect.h);
        drawPanel(rect.x, rect.y, rect.w, rect.h, hovered ? PANEL.cardHover : PANEL.card, PANEL.border);
        drawPanel(rect.x + 18, centerY - 23, 46, 46, PANEL.background, PANEL.border);
        drawSprite("/icons/download.png", Vector2(rect.x + 26, centerY - 15), Vector2(30, 30), PANEL.text);
        drawText("Data Path", Vector2(rect.x + 76, centerY - 14), 26, PANEL.text);
        drawText(ConfigManager.getAppDataDir(), Vector2(rect.x + rect.w - 46, centerY - 11), 20, PANEL.dim, "right");
        drawSprite("/icons/chevron-right.png", Vector2(rect.x + rect.w - 40, centerY - 12), Vector2(24, 24), PANEL.dim);
      },
      click: () => {
        const dir = ConfigManager.getAppDataDir();
        exec(
          process.platform === "win32"
            ? `explorer "${dir}"`
            : process.platform === "darwin"
              ? `open "${dir}"`
              : `xdg-open "${dir}"`
        );
        return true;
      },
    },
    {
      kind: "select",
      label: "Language",
      options: () => [{ id: "en", label: "English" }],
      get: () => ConfigManager.getExtra("language", "en"),
      set: (id) => ConfigManager.setExtra("language", id),
    },
    {
      kind: "slider",
      label: "FPS Cap",
      min: 60,
      max: 8000,
      step: 10,
      get: () => ConfigManager.get().maxFps,
      set: (value) => {
        ConfigManager.update({ maxFps: value });
        ConfigManager.save();
        Rhythia.maxFps = value;
      },
      format: (value) => `${Math.round(value)}`,
    },
    { kind: "section", label: "Modifiers" },
    gameSettingToggle("disablePausing"),
    gameSettingSlider("customSpeed", {
      format: (value) => `${+value.toFixed(2)}%`,
      set: (value) => {
        ConfigManager.setGameSettings({ customSpeed: value });
        ModeManager.setActiveModesByIds(ModeManager.getActiveModeIds());
      },
    }),
    gameSettingSlider("hitboxSize"),
    gameSettingSlider("hitWindow", { format: (value) => `${Math.round(value)}ms` }),
    gameSettingSlider("leadInTime", { format: (value) => `${Math.round(value)}ms` }),
    gameSettingToggle("counterSpeed"),
    gameSettingToggle("restartOnDeath"),
    gameSettingToggle("deathSlowdown"),
    { kind: "section", label: "Camera" },
    gameSettingSlider("mouseSensitivity", { label: "Sensitivity", step: 0.001 }),
    {
      kind: "toggle",
      label: "Absolute Mode",
      get: () => !ConfigManager.get().useRelativeCursor,
      set: (value) => ConfigManager.setUseRelativeCursor(!value),
      defaultValue: false,
    },
    gameSettingSlider("absoluteScale"),
    {
      kind: "select",
      label: "Camera Mode Presets",
      options: () => Object.keys(CAMERA_PRESETS).map((name) => ({ id: name, label: name })),
      get: () =>
        Object.keys(CAMERA_PRESETS).find((name) =>
          CAMERA_PRESETS[name].every((value, i) => gameSettingValue(CAMERA_PRESET_KEYS[i]) === value)
        ) ?? "Custom",
      set: (name) =>
        ConfigManager.setGameSettings(
          Object.fromEntries(CAMERA_PRESET_KEYS.map((key, i) => [key, CAMERA_PRESETS[name][i]]))
        ),
    },
    gameSettingSlider("tiltAmount", { label: "Camera Parallax", min: -10, max: 25 }),
    gameSettingSlider("uiTiltRate", { label: "HUD Parallax", min: -5 }),
    gameSettingSlider("gridParallax"),
    gameSettingToggle("spinCamera", { defaultValue: undefined }),
    gameSettingToggle("farawayHud"),
    gameSettingSlider("mouseBoundRate", {
      label: "Edge Buffer (Drift)",
      min: -0.3,
      max: 1,
      defaultValue: 0,
      get: () => gameSettingValue("mouseBoundRate") - 1,
      set: (value) => ConfigManager.setGameSettings({ mouseBoundRate: value + 1 }),
    }),
    gameSettingToggle("bufferCursor"),
    gameSettingToggle("followBufferCursor"),
    gameSettingSlider("cameraFov"),
    gameSettingToggle("hitFov"),
    {
      kind: "select",
      label: "Hit FOV Mode",
      options: () => ["Normal", "Additive", "Exponential", "Instant"].map((label, i) => ({ id: `${i}`, label })),
      get: () => `${gameSettingValue("hitFovMode")}`,
      set: (id) => ConfigManager.setGameSettings({ hitFovMode: Number(id) }),
    },
    gameSettingSlider("hitFovAmplifier"),
    gameSettingSlider("hitFovDecay"),
    { kind: "section", label: "Notes" },
    gameSettingSlider("squareScale", { label: "Note Scale", min: 0, max: 4 }),
    gameSettingSlider("noteMaxOpacity", { label: "Note Opacity" }),
    gameSettingSlider("approachRate", { max: 200 }),
    gameSettingSlider("approachDistance", { label: "Spawn Distance", max: 250 }),
    gameSettingSlider("fadeIn", {
      label: "Fade Length",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: 1,
      get: () => ConfigManager.get().gameFadeIn / 100,
      set: (value) => ConfigManager.setGameSettings({ fadeIn: value * 100 }),
    }),
    gameSettingToggle("pushback", { label: "Push Back" }),
    gameSettingToggle("halfGhost"),
  ],
});
