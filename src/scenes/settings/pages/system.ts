import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "system",
  title: "System",
  subtitle: "Core gameplay settings",
  icon: "/icons/settings-2.png",
  group: "General",
  rows: () => [],
});
