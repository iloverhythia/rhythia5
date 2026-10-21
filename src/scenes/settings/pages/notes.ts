import { GetTime, Vector3 } from "raylib";
import { registerSettingsPage, settingsNavigation, SettingsRow } from "../pages";
import { notify, pickFile, skinGridRows, textFieldRow } from "../skinGrid";
import { ConfigManager } from "../../../utils/configManager";
import { drawBorderRect, drawRect } from "../../../ui/draw";
import { PANEL } from "../../menu/atoms/BaseDrawer";
import {
  addSkinFile,
  customNoteMeshes,
  noteSkins,
  selectedNoteSkin,
} from "../../game/noteRenderers/noteSkins";
import { drawMesh, NoteMesh } from "../../game/noteRenderers/meshNoteRenderer";

const WHITE = { r: 255, g: 255, b: 255, a: 255 };

const draft = {
  name: "Custom Note",
  outline: true,
  corners: 4,
  rounding: 20,
  fill: 100,
  depth: 0.24,
  bevel: 10,
};

const grid = skinGridRows({
  favoritesKey: "noteSkinFavorites",
  placeholder: "Search skins",
  buttons: [
    { label: "Build", onClick: () => settingsNavigation.open("note-builder") },
    {
      label: "Import",
      onClick: () => {
        const file = pickFile({ images: "png" });
        if (file) ConfigManager.setExtra("noteSkin", addSkinFile("noteskins", file));
      },
    },
  ],
  cards: () =>
    noteSkins().map((skin) => ({
      id: skin.id,
      name: skin.name,
      draw: (rect) =>
        skin.renderer.drawPreview(
          Vector3(rect.x + rect.w / 2, rect.y + rect.h / 2, 0),
          rect.w,
          WHITE
        ),
    })),
  selected: () => selectedNoteSkin().id,
  select: (id) => ConfigManager.setExtra("noteSkin", id),
});

registerSettingsPage({
  id: "notes",
  title: "Notes",
  subtitle: "Choose a note skin",
  icon: "/icons/square-rotated.png",
  group: "Skinning",
  rows: () => grid,
});

const percent = (label: string, key: "rounding" | "fill" | "bevel"): SettingsRow => ({
  kind: "slider",
  label,
  min: 0,
  max: 100,
  step: 1,
  get: () => draft[key],
  set: (value) => (draft[key] = value),
  format: (value) => `${Math.round(value)}%`,
  maxLabel: "100%",
});

const nameRow = textFieldRow("Name", () => draft.name, (value) => (draft.name = value));

registerSettingsPage({
  id: "note-builder",
  title: "Note Builder",
  subtitle: "Create a custom 3D note mesh",
  rows: () => [
    nameRow,
    {
      kind: "toggle",
      label: "Draw Outline (editor only)",
      get: () => draft.outline,
      set: (value) => (draft.outline = value),
    },
    { kind: "section", label: "Shape" },
    {
      kind: "slider",
      label: "Corners",
      min: 3,
      max: 14,
      step: 1,
      get: () => draft.corners,
      set: (value) => (draft.corners = Math.round(value)),
    },
    percent("Corner Rounding", "rounding"),
    percent("Border Fill", "fill"),
    { kind: "section", label: "Volume" },
    {
      kind: "slider",
      label: "Depth",
      min: 0.02,
      max: 1,
      step: 0.01,
      get: () => draft.depth,
      set: (value) => (draft.depth = value),
      format: (value) => value.toFixed(2),
    },
    percent("Bevel", "bevel"),
    {
      kind: "button",
      label: "Save Note",
      onClick: () => {
        const { outline, ...mesh } = draft;
        const saved: NoteMesh = { ...mesh, name: mesh.name.trim() || "Custom Note", id: `custom:${Date.now()}` };
        ConfigManager.setExtra("customNoteMeshes", [...customNoteMeshes(), saved]);
        ConfigManager.setExtra("noteSkin", saved.id);
        notify(`Saved "${saved.name}"`);
      },
    },
  ],
  drawPreview: (rect) => {
    const time = GetTime();
    drawRect(rect.x, rect.y, rect.w, rect.h, { r: 8, g: 8, b: 9, a: 255 });
    drawBorderRect(rect.x, rect.y, rect.w, rect.h, 2, PANEL.border);
    drawMesh(
      draft,
      Vector3(rect.x + rect.w / 2, rect.y + rect.h / 2, 0),
      Math.min(rect.w, rect.h) * 0.6,
      WHITE,
      { x: Math.sin(time * 0.4) * 20, y: Math.sin(time * 0.6) * 35 },
      draft.outline
    );
  },
});
