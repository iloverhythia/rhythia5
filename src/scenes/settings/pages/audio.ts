import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "audio",
  title: "Audio",
  subtitle: "Timing, devices and volume",
  icon: "/icons/volume.png",
  group: "General",
  rows: () => [],
});
