import {
  gameSettingSlider,
  gameSettingToggle,
  registerSettingsPage,
  SettingsRow,
} from "../pages";
import { pickFile } from "../skinGrid";
import { fileLabel } from "../choices";
import { ConfigManager } from "../../../utils/configManager";
import { addSkinFile } from "../../game/noteRenderers/noteSkins";
import { NOTE_EFFECTS } from "../../game/atoms/NoteEffectSystem";

const effectRows = (label: string, key: string, fallback: string): SettingsRow[] => [
  {
    kind: "select",
    label,
    options: () => NOTE_EFFECTS,
    get: () => ConfigManager.getExtra(key, fallback),
    set: (id) => ConfigManager.setExtra(key, id),
  },
  {
    kind: "button",
    label: `${label} Image: ${fileLabel(ConfigManager.getExtra(`${key}Image`, "")) || "Default"}`,
    half: true,
    onClick: async () => {
      const file = await pickFile({ images: "png,jpg,jpeg,bmp,gif" });
      if (file) ConfigManager.setExtra(`${key}Image`, addSkinFile("notefx", file));
    },
  },
  { kind: "button", label: "Clear", half: true, onClick: () => ConfigManager.setExtra(`${key}Image`, "") },
];

registerSettingsPage({
  id: "hit-effects",
  title: "Hit Effects",
  subtitle: "Hit and miss effects",
  icon: "/icons/sparkles.png",
  group: "Skinning",
  rows: () => [
    { kind: "section", label: "Hits" },
    gameSettingToggle("burstParticleEnabled", { label: "Show Hit Effect" }),
    ...effectRows("Hit Effect", "hitEffect", "ssp_ripple"),
    gameSettingToggle("hitEffectAtCursor"),
    gameSettingSlider("burstParticleIntensity", { label: "Burst Intensity" }),
    gameSettingSlider("hitParticleOpacity", { label: "Burst Opacity" }),
    { kind: "section", label: "Misses" },
    gameSettingToggle("missParticleEnabled", { label: "Show Miss Effect" }),
    ...effectRows("Miss Effect", "missEffect", "ssp_miss"),
    gameSettingSlider("missParticleOpacity", { label: "Opacity" }),
    { kind: "section", label: "Score" },
    gameSettingToggle("scorePopup"),
    gameSettingToggle("billboardScore"),
  ],
});
