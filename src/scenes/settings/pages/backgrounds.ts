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
    gameSettingColor("Background Color", [
      "screenClearRed",
      "screenClearGreen",
      "screenClearBlue",
    ]),
    { kind: "section", label: "Cover Image" },
    gameSettingSlider("coverOpacity"),
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
