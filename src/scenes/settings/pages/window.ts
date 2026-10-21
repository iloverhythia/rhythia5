import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "window",
  title: "Window Settings",
  subtitle: "Resolution, window mode, and renderer",
  icon: "/icons/app-window.png",
  rows: () => [],
});
