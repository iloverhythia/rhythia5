import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "keybinds",
  title: "Keybinds",
  subtitle: "Keyboard shortcuts",
  icon: "/icons/keyboard.png",
  group: "General",
  rows: () => [],
});
