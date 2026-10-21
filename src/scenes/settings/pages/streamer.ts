import { ConfigManager } from "../../../utils/configManager";
import { registerSettingsPage, type SettingsRow } from "../pages";

const streamerToggle = (key: string, label: string): SettingsRow => ({
  kind: "toggle",
  label,
  defaultValue: false,
  get: () => ConfigManager.getExtra(`streamer.${key}`, false),
  set: (value) => ConfigManager.setExtra(`streamer.${key}`, value),
});

registerSettingsPage({
  id: "streamer",
  title: "Streamer",
  subtitle: "Streaming and recording options",
  icon: "/icons/device-tv.png",
  group: "General",
  rows: () => [
    streamerToggle("hideUsernames", "Hide usernames on leaderboards"),
    streamerToggle("hideProfile", "Hide your name and avatar in the top bar"),
    streamerToggle("hideMapTitles", "Hide map titles in-game"),
  ],
});
