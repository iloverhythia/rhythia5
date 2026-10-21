import type { Color } from "raylib";
import { registerSettingsPage, settingsNavigation, RGB, Rect } from "../pages";
import { notify, pickFile, skinGridRows, textFieldRow } from "../skinGrid";
import { ConfigManager } from "../../../utils/configManager";
import { drawRect } from "../../../ui/draw";
import { noteColorManager } from "../../../utils/noteColorPalette";
import { importColorset, saveColorset } from "../../../utils/colorsets";

const draft = { name: "", colors: [] as RGB[] };

const applyPalette = (name: string) => {
  const match = noteColorManager.getAllPalettes().find((palette) => palette.name === name);
  if (!match) return;
  noteColorManager.setCurrentPalette(match);
  ConfigManager.update({ activeColorPaletteName: name } as any);
  ConfigManager.save();
};

const drawSwatches = (rect: Rect, colors: Color[]) => {
  const cols = Math.ceil(Math.sqrt(colors.length));
  const cell = rect.w / cols;
  const gap = cols > 3 ? 2 : 0;
  const top = rect.y + (rect.h - Math.ceil(colors.length / cols) * cell) / 2;
  colors.forEach((color, i) =>
    drawRect(
      rect.x + (i % cols) * cell,
      top + Math.floor(i / cols) * cell,
      cell - gap,
      cell - gap,
      { ...color, a: 255 }
    )
  );
};

const grid = skinGridRows({
  favoritesKey: "colorSetFavorites",
  placeholder: "Search color sets",
  buttons: [
    {
      label: "New",
      onClick: () => {
        draft.name = "New Color Set";
        draft.colors = noteColorManager.getCurrentPalette().colors.slice(0, 4).map(({ r, g, b }) => ({ r, g, b }));
        settingsNavigation.open("color-set-editor");
      },
    },
    {
      label: "Import",
      onClick: () => {
        const file = pickFile({ text: "txt" });
        const info = file ? importColorset(file) : null;
        if (info) applyPalette(info.name);
        else if (file) notify("Invalid colorset file");
      },
    },
  ],
  cards: () =>
    noteColorManager.getAllPalettes().map((palette) => ({
      id: palette.name,
      name: palette.name,
      draw: (rect) => drawSwatches(rect, palette.colors),
    })),
  selected: () => noteColorManager.getCurrentPalette().name,
  select: applyPalette,
});

registerSettingsPage({
  id: "color-sets",
  title: "Color Sets",
  subtitle: "Choose a color set",
  icon: "/icons/palette.png",
  group: "Skinning",
  rows: () => grid,
});

const nameRow = textFieldRow("Name", () => draft.name, (value) => (draft.name = value));

registerSettingsPage({
  id: "color-set-editor",
  title: "New Color Set",
  subtitle: "Pick the colors notes cycle through",
  rows: () => [
    nameRow,
    { kind: "section", label: "Colors" },
    ...draft.colors.map((_, i) => ({
      kind: "color" as const,
      label: `Color ${i + 1}`,
      get: () => draft.colors[i],
      set: (color: RGB) => (draft.colors[i] = color),
    })),
    {
      kind: "button",
      label: "Add Color",
      half: true,
      onClick: () => draft.colors.push({ ...(draft.colors[draft.colors.length - 1] ?? { r: 255, g: 255, b: 255 }) }),
    },
    {
      kind: "button",
      label: "Remove Color",
      half: true,
      onClick: () => draft.colors.length > 1 && draft.colors.pop(),
    },
    {
      kind: "button",
      label: "Save Color Set",
      onClick: () => {
        const name = draft.name.replace(/[\\/:*?"<>|]/g, "").trim() || "Color Set";
        saveColorset(name, draft.colors.map((color) => ({ ...color, a: 255 })));
        applyPalette(name);
        notify(`Saved "${name}"`);
      },
    },
  ],
});
