import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "ui-colors",
  title: "UI Colors",
  subtitle: "HUD, panel and grade colors",
  icon: "/icons/palette.png",
  group: "General",
  rows: () => [],
});
