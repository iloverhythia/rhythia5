import {
  registerSettingsPage,
  gameSettingSlider,
  gameSettingToggle,
  type SettingsRow,
} from "../pages";
import { ConfigManager } from "../../../utils/configManager";
import { toGameConfigKey } from "../../../utils/gameSettingsSchema";
import { uiColorRow } from "./uiColors";

const isOn = (key: string) => ConfigManager.get()[toGameConfigKey(key)] > 0;

const groupToggle = (label: string, keys: string[]): SettingsRow => ({
  kind: "toggle",
  label,
  defaultValue: true,
  get: () => keys.some(isOn),
  set: (value) => ConfigManager.setGameSettings(Object.fromEntries(keys.map((key) => [key, value ? 1 : 0]))),
});

const areas = [
  {
    id: "interfaceLeft",
    title: "Left Panel",
    subtitle: "Combo, accuracy and misses",
    icon: "/icons/layout-sidebar.png",
    keys: ["hudLeftBackground", "hudCombo", "hudAccuracy", "hudAccuracyBar", "hudMisses", "hudPauses"],
    show: "Show Left Panel",
  },
  {
    id: "interfaceRight",
    title: "Right Panel",
    subtitle: "Score, rank and notes left",
    icon: "/icons/layout-sidebar-right.png",
    keys: ["hudRightBackground", "hudScore", "hudRank", "hudNotesLeft"],
    show: "Show Right Panel",
  },
  {
    id: "interfaceTopBottom",
    title: "Top Bottom",
    subtitle: "Map info, progress and health",
    icon: "/icons/layout-navbar.png",
    keys: ["hudMapTitle", "hudTime", "hudProgressBar", "hudHealthBar"],
    extra: (): SettingsRow[] => [
      groupToggle("Show Timer", ["hudMapTitle", "hudTime", "hudProgressBar"]),
      gameSettingToggle("attachTimerToGrid"),
      gameSettingToggle("attachHpToGrid"),
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
    rows: () => [
      ...(area.show ? [groupToggle(area.show, area.keys)] : []),
      ...(area.extra?.() ?? []),
      ...area.keys.map((key) => gameSettingToggle(key)),
    ],
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
    uiColorRow("Panel Background", "panelBg"),
    gameSettingSlider("failVignetteOpacity"),
    gameSettingSlider("missParticleOpacity", { label: "Miss Effect Opacity" }),
    { kind: "section", label: "UI" },
    gameSettingToggle("borderEnabled", { label: "Border" }),
    gameSettingToggle("simpleHud"),
    gameSettingToggle("showConfig"),
    gameSettingToggle("displayTrueCombo"),
    gameSettingToggle("scorePopup"),
    gameSettingToggle("expandHudOnHr"),
    gameSettingToggle("showFcGrade"),
  ],
});
