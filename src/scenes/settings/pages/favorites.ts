import { Vector2 } from "raylib";
import { hasFlag, listSettingsPages, registerSettingsPage, SettingsRow } from "../pages";
import { drawText } from "../../../utils/text";
import { PANEL } from "../../menu/atoms/BaseDrawer";

registerSettingsPage({
  id: "favorites",
  title: "Favorites",
  subtitle: "Your favorite settings",
  icon: "/icons/heart.png",
  group: "General",
  rows: () => {
    const rows = listSettingsPages()
      .filter((page) => page.id !== "favorites")
      .flatMap((page) => page.rows())
      .filter((row): row is Extract<SettingsRow, { label: string }> =>
        "label" in row && row.kind !== "section" && hasFlag("settingsFavorites", row.label)
      );
    return rows.length
      ? rows
      : [
          {
            kind: "custom",
            height: () => 40,
            draw: (rect) =>
              drawText("Click the heart next to a setting to add it here", Vector2(rect.x, rect.y + 8), 20, PANEL.dim),
          },
        ];
  },
});
