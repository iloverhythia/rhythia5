import {
  registerSettingsPage,
  gameSettingSlider,
  gameSettingToggle,
  type SettingsRow,
  type RGB,
} from "../pages";
import { ConfigManager } from "../../../utils/configManager";
import { toGameConfigKey } from "../../../utils/gameSettingsSchema";

const areas = [
  {
    id: "interfaceLeft",
    title: "Left Panel",
    subtitle: "Combo, accuracy and misses",
    icon: "/icons/layout-sidebar.png",
    keys: ["hudLeftBackground", "hudCombo", "hudAccuracy", "hudMisses"],
  },
  {
    id: "interfaceRight",
    title: "Right Panel",
    subtitle: "Score, rank and notes left",
    icon: "/icons/layout-sidebar-right.png",
    keys: ["hudRightBackground", "hudScore", "hudRank", "hudNotesLeft"],
  },
  {
    id: "interfaceTopBottom",
    title: "Top Bottom",
    subtitle: "Map info, progress and health",
    icon: "/icons/layout-navbar.png",
    keys: ["hudMapTitle", "hudTime", "hudProgressBar", "hudHealthBar"],
    extra: (): SettingsRow[] => [
      gameSettingSlider("healthBarWidth"),
      gameSettingSlider("healthBarHeight"),
      gameSettingSlider("healthBarOpacity"),
    ],
  },
  {
    id: "interfaceText",
    title: "Text",
    subtitle: "Text size and overlays",
    icon: "/icons/typography.png",
    keys: ["hudModeIndicator", "hudSkipPrompt"],
    extra: (): SettingsRow[] => [gameSettingSlider("uiScale"), gameSettingSlider("uiTiltRate")],
  },
];

areas.forEach((area) =>
  registerSettingsPage({
    id: area.id,
    title: area.title,
    subtitle: area.subtitle,
    icon: area.icon,
    rows: () => [...(area.extra?.() ?? []), ...area.keys.map((key) => gameSettingToggle(key))],
  })
);

registerSettingsPage({
  id: "interfaceGrid",
  title: "Grid",
  subtitle: "Background grid",
  icon: "/icons/grid-3x3.png",
  rows: () => [
    gameSettingToggle("gridEnabled", { label: "Grid" }),
    gameSettingSlider("gridOpacity"),
    gameSettingSlider("gridSpeedMultiplier"),
    gameSettingSlider("gridUnitsPerSecond"),
    gameSettingSlider("gridDepth"),
    gameSettingSlider("gridFadeFalloff"),
  ],
});

const isOn = (key: string) => ConfigManager.get()[toGameConfigKey(key)] > 0;

const areaValue = (keys: string[]) => {
  const on = keys.filter(isOn).length;
  return on === keys.length ? "All" : on === 0 ? "All Off" : "Custom";
};

registerSettingsPage({
  id: "interface",
  title: "Interface",
  subtitle: "Interface layout and panels",
  icon: "/icons/layout-board.png",
  group: "General",
  rows: () => [
    ...areas.slice(0, 3).map(
      (area): SettingsRow => ({
        kind: "link",
        label: area.title,
        icon: area.icon,
        page: area.id,
        value: () => areaValue(area.keys),
        half: true,
      })
    ),
    {
      kind: "link",
      label: "Grid",
      icon: "/icons/grid-3x3.png",
      page: "interfaceGrid",
      value: () => (isOn("gridEnabled") ? "On" : "Off"),
      half: true,
    },
    { kind: "link", label: "Text", icon: "/icons/typography.png", page: "interfaceText", value: () => "Edit" },
    gameSettingSlider("uiOpacity", {
      label: "Panel Opacity",
      min: 0,
      max: 1,
      step: 0.01,
      defaultValue: undefined,
      get: () => ConfigManager.get().gameUiOpacity * 5,
      set: (value) => ConfigManager.setGameSettings({ uiOpacity: value / 5 }),
    }),
    {
      kind: "color",
      label: "Panel Color",
      get: () => ConfigManager.getExtra<RGB>("panelColor", { r: 255, g: 255, b: 255 }),
      set: (color) => ConfigManager.setExtra("panelColor", color),
      defaultValue: { r: 255, g: 255, b: 255 },
      opacity: {
        get: () => ConfigManager.getExtra("panelColorOpacity", 0),
        set: (value) => ConfigManager.setExtra("panelColorOpacity", value),
      },
    },
    gameSettingSlider("failVignetteOpacity"),
    gameSettingSlider("missParticleOpacity", { label: "Miss Effect Opacity" }),
  ],
});
