import { ConfigManager } from "../../../utils/configManager";
import { extraToggle, registerSettingsPage, type SettingsRow } from "../pages";

const extraSelect = (key: string, label: string, defaultValue: number, options: string[]): SettingsRow => ({
  kind: "select",
  label,
  options: () => options.map((label, id) => ({ id: String(id), label })),
  get: () => String(ConfigManager.getExtra(key, defaultValue)),
  set: (id) => ConfigManager.setExtra(key, Number(id)),
});

registerSettingsPage({
  id: "replays",
  title: "Replays & Misc",
  subtitle: "Recording and experimental options",
  icon: "/icons/device-tv.png",
  group: "General",
  rows: () => [
    { kind: "section", label: "Recording" },
    extraToggle("recordReplays", "Record Replays", false),
    extraToggle("hideReplayUi", "Hide Replay UI", false),
    extraSelect("recordMode", "Recording Mode", 1, ["Legacy", "Maximise", "Minimise"]),
    extraSelect("recordLimit", "Recording FPS", 0, ["30/144", "60/240"]),
    { kind: "section", label: "Experimental" },
    extraToggle("showStats", "Show Extensive Stats", false),
    extraToggle("realisticAutoplay", "Realistic Autoplay", false),
    extraToggle("disableIntro", "Disable Intro Cutscene", false),
  ],
});
