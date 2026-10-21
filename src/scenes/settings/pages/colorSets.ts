import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "color-sets",
  title: "Color Sets",
  subtitle: "Choose a color set",
  icon: "/icons/palette.png",
  group: "Skinning",
  rows: () => [],
});
