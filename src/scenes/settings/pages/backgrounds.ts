import { ConfigManager } from "../../../utils/configManager";
import {
  gameSettingSlider,
  gameSettingToggle,
  registerSettingsPage,
  type SettingsRow,
} from "../pages";
import {
  choiceRows,
  gameSettingColor,
  gameSettingValue,
  listImported,
  pickFileButton,
} from "../choices";

const decoration = (
  label: string,
  enabledKey: string,
  keys: string[],
  extra: SettingsRow[] = []
): SettingsRow[] => [
  { kind: "section", label },
  gameSettingToggle(enabledKey, { label: "Enabled" }),
  ...(gameSettingValue(enabledKey) >= 0.5
    ? [...keys.map((key) => gameSettingSlider(key)), ...extra]
    : []),
];

const decorationsOff = {
  tunnelEnabled: 0,
  raysEnabled: 0,
  chevronEnabled: 0,
  gridEnabled: 0,
  videoEnabled: 0,
};

const WORLDS = [
  { id: "tunnel", label: "Tunnel (Rhythia)", settings: { ...decorationsOff, tunnelEnabled: 1 } },
  { id: "void", label: "Void (Rhythia)", settings: { ...decorationsOff, coverOpacity: 0 } },
  { id: "grid", label: "Grid (Rhythia)", settings: { ...decorationsOff, gridEnabled: 1 } },
  { id: "rays", label: "Rays", settings: { ...decorationsOff, raysEnabled: 1 } },
  { id: "chevron", label: "Chevron", settings: { ...decorationsOff, chevronEnabled: 1 } },
  { id: "video", label: "Video", settings: { ...decorationsOff, videoEnabled: 1 } },
  { id: "custom", label: "Custom Background", settings: { ...decorationsOff, coverOpacity: 1 } },
];

const currentWorld = () =>
  WORLDS.find((world) =>
    Object.entries(world.settings).every(
      ([key, value]) => (gameSettingValue(key) >= 0.5 ? 1 : 0) === value
    )
  );

const setConfigPath =
  (key: "coverImagePath" | "videoPath") => (file: string) => {
    ConfigManager.update(
      key === "videoPath" ? { videoPath: file } : { coverImagePath: file }
    );
    ConfigManager.save();
  };

registerSettingsPage({
  id: "backgrounds",
  title: "Backgrounds",
  subtitle: "Backgrounds and decorations",
  icon: "/icons/photo.png",
  group: "General",
  rows: () => [
    { kind: "section", label: "General" },
    {
      kind: "link",
      label: "Background World",
      icon: "/icons/world.png",
      page: "backgrounds-world",
      value: () => currentWorld()?.label ?? "Custom",
    },
    gameSettingToggle("disableBgEffects"),
    gameSettingColor("Background Color", [
      "screenClearRed",
      "screenClearGreen",
      "screenClearBlue",
    ]),
    { kind: "section", label: "Cover Image" },
    gameSettingSlider("coverOpacity"),
    gameSettingColor("Custom BG Color", [
      "customBgColorRed",
      "customBgColorGreen",
      "customBgColorBlue",
    ]),
    ...choiceRows(
      [
        { id: "", label: "Default" },
        ...listImported("backgrounds", ConfigManager.get().coverImagePath),
      ],
      () => ConfigManager.get().coverImagePath || "",
      setConfigPath("coverImagePath")
    ),
    pickFileButton(
      "Import cover image",
      { images: "png,jpg,jpeg" },
      setConfigPath("coverImagePath"),
      "backgrounds"
    ),
    ...decoration("Tunnel", "tunnelEnabled", ["backgroundOpacity"]),
    ...decoration("Rays", "raysEnabled", ["rayOpacity", "rayIntensity", "rayWidth"]),
    ...decoration("Chevron", "chevronEnabled", [
      "chevronOpacity",
      "chevronWidth",
      "chevronGap",
      "chevronSpeedMultiplier",
      "chevronSmallSize",
      "chevronLargeSize",
    ]),
    ...decoration("Grid", "gridEnabled", [
      "gridOpacity",
      "gridSpeedMultiplier",
      "gridUnitsPerSecond",
      "gridDepth",
      "gridFadeFalloff",
    ]),
    ...decoration(
      "Video",
      "videoEnabled",
      ["videoOpacity"],
      [pickFileButton("Choose video", { video: "mp4,mkv" }, setConfigPath("videoPath"))]
    ),
  ],
});

registerSettingsPage({
  id: "backgrounds-world",
  title: "Background World",
  subtitle: "Background and environment used in the song player",
  icon: "/icons/world.png",
  rows: () =>
    choiceRows(WORLDS, () => currentWorld()?.id ?? "", (id) =>
      ConfigManager.setGameSettings(WORLDS.find((world) => world.id === id)!.settings)
    ),
});
