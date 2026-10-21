import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "borders",
  title: "Borders",
  subtitle: "Choose a border skin",
  icon: "/icons/border-outer.png",
  group: "Skinning",
  rows: () => [],
});
