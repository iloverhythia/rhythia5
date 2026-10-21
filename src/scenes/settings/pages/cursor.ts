import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "cursor",
  title: "Cursor",
  subtitle: "Cursor behavior and feel",
  icon: "/icons/cursor-text.png",
  group: "General",
  rows: () => [],
});
