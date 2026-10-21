import {
  gameSettingSlider,
  gameSettingToggle,
  registerSettingsPage,
} from "../pages";

registerSettingsPage({
  id: "hit-effects",
  title: "Hit Effects",
  subtitle: "Hit and miss effects",
  icon: "/icons/sparkles.png",
  group: "Skinning",
  rows: () => [
    { kind: "section", label: "Hits" },
    gameSettingToggle("burstParticleEnabled", { label: "Burst Particles" }),
    gameSettingSlider("burstParticleIntensity", { label: "Intensity" }),
    gameSettingSlider("hitParticleOpacity", { label: "Opacity" }),
    { kind: "section", label: "Misses" },
    gameSettingToggle("missParticleEnabled", { label: "Miss Cross" }),
    gameSettingSlider("missParticleOpacity", { label: "Opacity" }),
  ],
});
