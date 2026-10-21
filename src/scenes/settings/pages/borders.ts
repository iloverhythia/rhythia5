import { gameSettingToggle, registerSettingsPage } from "../pages";
import { gameSettingColor, gameSettingValue } from "../choices";
import { pickFile, skinGridRows } from "../skinGrid";
import { ConfigManager } from "../../../utils/configManager";
import { borderSkins, selectedBorderSkin } from "../../game/borderSkins";
import { addSkinFile } from "../../game/noteRenderers/noteSkins";

const grid = skinGridRows({
  favoritesKey: "borderSkinFavorites",
  placeholder: "Search skins",
  buttons: [
    {
      label: "Import",
      onClick: async () => {
        const file = await pickFile({ images: "png" });
        if (file) ConfigManager.setExtra("borderSkin", addSkinFile("borderskins", file));
      },
    },
  ],
  cards: () =>
    borderSkins().map((skin) => ({
      id: skin.id,
      name: skin.name,
      draw: (rect) => skin.draw(rect.x, rect.y, rect.w, { r: 255, g: 255, b: 255, a: 255 }),
    })),
  selected: () => selectedBorderSkin().id,
  select: (id) => ConfigManager.setExtra("borderSkin", id),
});

registerSettingsPage({
  id: "borders",
  title: "Borders",
  subtitle: "Choose a border skin",
  icon: "/icons/border-outer.png",
  group: "Skinning",
  rows: () => [
    gameSettingToggle("borderEnabled"),
    gameSettingColor("Border Color", ["borderColorRed", "borderColorGreen", "borderColorBlue"], {
      opacity: {
        get: () => gameSettingValue("borderColorOpacity"),
        set: (value) => ConfigManager.setGameSettings({ borderColorOpacity: value }),
      },
    }),
    ...grid,
  ],
});
