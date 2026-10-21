import { ConfigManager } from "../../../utils/configManager";
import {
  getSoundEffect,
  getVolumes,
  playFx,
  setFxVolume,
  setMasterVolume,
  setMusicVolume,
  type SoundEffectKind,
} from "../../../utils/soundManager";
import { gameSettingSlider, registerSettingsPage, type SettingsRow } from "../pages";
import { choiceRows, fileLabel, listImported, pickFileButton } from "../choices";

const SOUND_EFFECTS: { kind: SoundEffectKind; label: string }[] = [
  { kind: "hit", label: "Hits" },
  { kind: "miss", label: "Misses" },
  { kind: "fail", label: "Fail" },
  { kind: "retry", label: "Retry" },
];

const BUILT_IN_SOUNDS = [
  "/hit.wav",
  "/click.wav",
  "/hover.wav",
  "/menuback.wav",
  "/restart.wav",
  "/fail.ogg",
  "/done.wav",
  "/match-start.wav",
  "/type.wav",
  "/wurly.wav",
];

const volumeSlider = (
  label: string,
  key: "master" | "music" | "fx",
  defaultValue: number,
  apply: (volume: number) => void
): SettingsRow => ({
  kind: "slider",
  label,
  min: 0,
  max: 100,
  step: 1,
  defaultValue,
  get: () => Math.round(getVolumes()[key] * 100),
  set: (value) => apply(value / 100),
});

SOUND_EFFECTS.forEach(({ kind, label }) => {
  const select = (sound: string) => {
    ConfigManager.setExtra(`sound.${kind}`, sound);
    if (sound) playFx(sound);
  };
  registerSettingsPage({
    id: `sound-${kind}`,
    title: label,
    subtitle: "Choose or import a sound effect",
    icon: "/icons/music.png",
    rows: () => [
      ...choiceRows(
        [
          { id: "", label: "None" },
          ...BUILT_IN_SOUNDS.map((id) => ({ id, label: fileLabel(id) })),
          ...listImported("sounds"),
        ],
        () => getSoundEffect(kind),
        select
      ),
      pickFileButton("Import sound", { audio: "wav,ogg,mp3,flac" }, select, "sounds"),
    ],
  });
});

registerSettingsPage({
  id: "audio",
  title: "Audio",
  subtitle: "Timing, devices and volume",
  icon: "/icons/volume.png",
  group: "General",
  rows: () => [
    { kind: "section", label: "General" },
    {
      kind: "select",
      label: "Audio Device",
      options: () => [{ id: "default", label: "Default" }],
      get: () => "default",
      set: () => {},
    },
    ...SOUND_EFFECTS.map(
      ({ kind, label }): SettingsRow => ({
        kind: "link",
        label,
        icon: "/icons/music.png",
        page: `sound-${kind}`,
        value: () => (getSoundEffect(kind) ? fileLabel(getSoundEffect(kind)) : "None"),
        half: true,
      })
    ),
    { kind: "section", label: "Timing" },
    gameSettingSlider("globalOffset", { label: "Global offset (ms)" }),
    { kind: "section", label: "Volume" },
    volumeSlider("Master Volume", "master", 20, (volume) => {
      setMasterVolume(volume);
      ConfigManager.setVolumes(volume);
    }),
    volumeSlider("Music Volume", "music", 100, (volume) => {
      setMusicVolume(volume);
      ConfigManager.setVolumes(undefined, volume);
    }),
    volumeSlider("Effects Volume", "fx", 80, (volume) => {
      setFxVolume(volume);
      ConfigManager.setVolumes(undefined, undefined, volume);
    }),
  ],
});
