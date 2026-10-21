import { registerSettingsPage } from "../pages";

registerSettingsPage({
  id: "favorites",
  title: "Favorites",
  subtitle: "Your favorite settings",
  icon: "/icons/heart.png",
  group: "General",
  rows: () => [],
});
