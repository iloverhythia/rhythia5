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
    { kind: "section", label: "Camera" },
    gameSettingSlider("tiltAmount", { label: "Parallax", min: -10, max: 25 }),
    gameSettingSlider("gridParallax"),
    gameSettingSlider("cameraFov"),
    gameSettingToggle("spinCamera", { defaultValue: undefined }),
    { kind: "section", label: "Notes" },
    gameSettingSlider("squareScale", { label: "Note Scale", min: 0, max: 4 }),
    gameSettingSlider("noteMaxOpacity", { label: "Note Opacity" }),
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
    gameSettingToggle("halfGhost"),
    { kind: "section", label: "Gameplay" },
    gameSettingSlider("approachRate", { max: 200 }),
    gameSettingToggle("deathSlowdown"),
    gameSettingToggle("pushback", { label: "Push Back" }),
  ],
});
