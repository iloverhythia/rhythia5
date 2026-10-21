import * as fs from "fs";
import * as path from "path";
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
import { extraToggle, gameSettingSlider, registerSettingsPage, type SettingsRow } from "../pages";
import { createPopup } from "../../menu/atoms/Popup";
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
  defaultValue: number,
  get: () => number,
  apply: (volume: number) => void
): SettingsRow => ({
  kind: "slider",
  label,
  min: 0,
  max: 100,
  step: 1,
  defaultValue,
  get: () => Math.round(get() * 100),
  set: (value) => apply(value / 100),
  format: (value) => `${value}% / ${Math.max(-80, 20 * Math.log10(value / 100)).toFixed(1)} dB`,
});

const extraSlider = (key: string, label: string, defaultValue: number): SettingsRow => ({
  kind: "slider",
  label,
  min: 0.5,
  max: 2,
  step: 0.01,
  defaultValue,
  get: () => ConfigManager.getExtra(key, defaultValue),
  set: (value) => ConfigManager.setExtra(key, value),
});

const replaceSelected = (from: string, to?: string) =>
  SOUND_EFFECTS.forEach(({ kind }) => {
    if (getSoundEffect(kind) === from) ConfigManager.setExtra(`sound.${kind}`, to);
  });

const customSoundRows = (): SettingsRow[] =>
  listImported("sounds").flatMap(({ id, label }): SettingsRow[] => [
    { kind: "button", label: `Play ${label}`, onClick: () => playFx(id), half: true },
    {
      kind: "button",
      label: `Rename ${label}`,
      half: true,
      onClick: () =>
        createPopup("prompt").showPrompt({
          message: "Rename this sound",
          initialValue: label,
          placeholder: "Sound name",
          onConfirm: (name) => {
            if (!name.trim()) return;
            const target = path.join(path.dirname(id), name.trim() + path.extname(id));
            fs.renameSync(id, target);
            replaceSelected(id, target);
          },
        }),
    },
    {
      kind: "button",
      label: `Delete ${label}`,
      onClick: () =>
        createPopup("confirm").showConfirm({
          message: `Delete "${label}"? This can't be undone.`,
          confirmText: "Delete",
          onConfirm: () => {
            fs.unlinkSync(id);
            replaceSelected(id);
          },
        }),
    },
  ]);

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
      { kind: "section", label: "Custom Sounds" },
      ...customSoundRows(),
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
    extraToggle("sound.hit.enabled", "Hit Sound", true),
    extraToggle("sound.miss.enabled", "Miss Sound", true),
    extraToggle("sfx2d", "Disable Directional", false),
    extraToggle("hitPitch", "Random Hit Pitch", false),
    extraSlider("hitPitchMin", "Hit Pitch Min", 0.9),
    extraSlider("hitPitchMax", "Hit Pitch Max", 1.15),
    { kind: "section", label: "Timing" },
    gameSettingSlider("globalOffset", { label: "Universal Offset (ms)" }),
    { kind: "section", label: "Music" },
    extraToggle("playMenuMusic", "Menu Music", true),
    extraToggle("autoPreviewSong", "Auto Preview Songs", true),
    { kind: "section", label: "Volume" },
    volumeSlider("Master Volume", 20, () => getVolumes().master, (volume) => {
      setMasterVolume(volume);
      ConfigManager.setVolumes(volume);
    }),
    volumeSlider("Music Volume", 100, () => getVolumes().music, (volume) => {
      setMusicVolume(volume);
      ConfigManager.setVolumes(undefined, volume);
    }),
    volumeSlider("Effects Volume", 80, () => getVolumes().fx, (volume) => {
      setFxVolume(volume);
      ConfigManager.setVolumes(undefined, undefined, volume);
    }),
    ...(
      [
        ["hit", "Hit Volume"],
        ["miss", "Miss Volume"],
        ["fail", "Fail Volume"],
      ] as const
    ).map(([kind, label]) =>
      volumeSlider(label, 100, () => ConfigManager.getExtra(`volume.${kind}`, 1), (volume) =>
        ConfigManager.setExtra(`volume.${kind}`, volume)
      )
    ),
  ],
});
