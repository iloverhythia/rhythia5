import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "streamer",
  title: "Streamer",
  subtitle: "Streaming and recording options",
  icon: "/icons/device-tv.png",
  group: "General",
  rows: () => [],
});
