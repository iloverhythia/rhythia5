import { GetKeyPressed, Vector2 } from "raylib";
import { registerSettingsPage, SettingsRow } from "../pages";
import { keybinds, KeybindAction } from "../../../utils/keybinds";
import { drawCard, drawField } from "../SettingsDrawer";
import { drawText } from "../../../utils/text";
import { inRect } from "../../../utils/geometry";
import { PANEL } from "../../menu/atoms/BaseDrawer";

let waiting: KeybindAction | null = null;

registerSettingsPage({
  id: "keybinds",
  title: "Keybinds",
  subtitle: "Keyboard shortcuts",
  icon: "/icons/keyboard.png",
  group: "General",
  rows: () =>
    (Object.keys(keybinds.getAllKeybinds()) as KeybindAction[]).map(
      (action): SettingsRow => ({
        kind: "custom",
        height: () => 60,
        draw: (rect, mouse) => {
          const name = waiting === action ? keybinds.getKeyName(GetKeyPressed()) : undefined;
          if (name) {
            keybinds.setKeybind(action, name);
            waiting = null;
          }
          const key = { x: rect.x + rect.w - 192, y: rect.y + 12, w: 180, h: 36 };
          drawCard(rect);
          drawText(
            action.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()),
            Vector2(rect.x + 14, rect.y + 18),
            22,
            PANEL.text
          );
          drawField(
            key,
            waiting === action ? "Press a key..." : keybinds.getKeyDisplayName(keybinds.getKeybind(action)),
            "center",
            18,
            waiting === action || (!!mouse && inRect(mouse.x, mouse.y, key.x, key.y, key.w, key.h))
          );
        },
        click: () => {
          waiting = waiting === action ? null : action;
          return true;
        },
      })
    ),
});
