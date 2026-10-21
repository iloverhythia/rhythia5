import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "notes",
  title: "Notes",
  subtitle: "Choose a note skin",
  icon: "/icons/square-rotated.png",
  group: "Skinning",
  rows: () => [],
});
