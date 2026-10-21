import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "replays",
  title: "Replays & Misc",
  subtitle: "Recording and experimental options",
  icon: "/icons/device-tv.png",
  group: "General",
  rows: () => [],
});
