import { ConfigManager } from "../../../utils/configManager";
import { gameSettingSlider, registerSettingsPage } from "../pages";
import {
  choiceRows,
  fileLabel,
  gameSettingColor,
  gameSettingValue,
  listImported,
  pickFileButton,
} from "../choices";

const currentSkin = () =>
  gameSettingValue("customCursorEnabled") >= 0.5
    ? ConfigManager.get().cursorImagePath || ""
    : "";

const selectSkin = (file: string) => {
  ConfigManager.update({ cursorImagePath: file });
  ConfigManager.setGameSettings({ customCursorEnabled: file ? 1 : 0 });
};

const off = {
  cursorTrailEnabled: 0,
  cursorRainbowEnabled: 0,
  starTrailEnabled: 0,
  spaceCursorEnabled: 0,
  customCursorTrailEnabled: 0,
};

const TRAILS = [
  { id: "none", label: "None", settings: off },
  { id: "solid", label: "Solid", settings: { ...off, cursorTrailEnabled: 1 } },
  {
    id: "rainbow",
    label: "Rainbow",
    settings: { ...off, cursorTrailEnabled: 1, cursorRainbowEnabled: 1 },
  },
  {
    id: "stars",
    label: "Stars",
    settings: {
      ...off,
      cursorTrailEnabled: 1,
      cursorRainbowEnabled: 1,
      starTrailEnabled: 1,
    },
  },
  { id: "space", label: "Space", settings: { ...off, spaceCursorEnabled: 1 } },
  {
    id: "image",
    label: "Cursor Image",
    settings: { ...off, customCursorTrailEnabled: 1 },
  },
];

const currentTrail = () =>
  TRAILS.find((trail) =>
    Object.entries(trail.settings).every(
      ([key, value]) => (gameSettingValue(key) >= 0.5 ? 1 : 0) === value
    )
  );

registerSettingsPage({
  id: "cursor",
  title: "Cursor",
  subtitle: "Cursor behavior and feel",
  icon: "/icons/cursor-text.png",
  group: "General",
  rows: () => [
    {
      kind: "link",
      label: "Cursor Skin",
      icon: "/icons/cursor-text.png",
      page: "cursor-skin",
      value: () => (currentSkin() ? fileLabel(currentSkin()) : "Default"),
      half: true,
    },
    {
      kind: "link",
      label: "Cursor Trail",
      icon: "/icons/sparkles.png",
      page: "cursor-trail",
      value: () => currentTrail()?.label ?? "Custom",
      half: true,
    },
    gameSettingColor(
      "Cursor Color",
      ["cursorColorRed", "cursorColorGreen", "cursorColorBlue"],
      {
        opacity: {
          get: () => gameSettingValue("cursorOpacity"),
          set: (value) => ConfigManager.setGameSettings({ cursorOpacity: value }),
        },
      }
    ),
    gameSettingSlider("mouseSensitivity", {
      label: "Cursor Sensitivity",
      step: 0.001,
    }),
    gameSettingSlider("cursorScale", { max: 6, step: 0.01 }),
    gameSettingSlider("cursorRotation"),
    {
      kind: "toggle",
      label: "Cursor Mode",
      get: () => ConfigManager.get().useRelativeCursor,
      set: (value) => ConfigManager.setUseRelativeCursor(value),
      defaultValue: true,
      onLabel: "Relative",
      offLabel: "Absolute",
    },
    gameSettingSlider("mouseBoundRate", {
      label: "Edge Buffer (drift)",
      min: -0.3,
      max: 1,
      defaultValue: 0,
      get: () => gameSettingValue("mouseBoundRate") - 1,
      set: (value) => ConfigManager.setGameSettings({ mouseBoundRate: value + 1 }),
    }),
  ],
});

registerSettingsPage({
  id: "cursor-skin",
  title: "Cursor Skin",
  subtitle: "Choose or import a cursor image",
  icon: "/icons/cursor-text.png",
  rows: () => [
    ...choiceRows(
      [
        { id: "", label: "Default" },
        ...listImported("cursors", ConfigManager.get().cursorImagePath),
      ],
      currentSkin,
      selectSkin
    ),
    pickFileButton(
      "Import cursor image",
      { images: "png,jpg,jpeg" },
      selectSkin,
      "cursors"
    ),
  ],
});

registerSettingsPage({
  id: "cursor-trail",
  title: "Cursor Trail",
  subtitle: "Choose a cursor trail",
  icon: "/icons/sparkles.png",
  rows: () => [
    ...choiceRows(TRAILS, () => currentTrail()?.id ?? "", (id) =>
      ConfigManager.setGameSettings(TRAILS.find((trail) => trail.id === id)!.settings)
    ),
    { kind: "section", label: "Options" },
    gameSettingSlider("cursorTrailFadeRate"),
    gameSettingSlider("rainbowRate"),
  ],
});
