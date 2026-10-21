import { GetTime, Vector3 } from "raylib";
import {
  gameSettingSlider,
  gameSettingToggle,
  registerSettingsPage,
  settingsNavigation,
  SettingsRow,
} from "../pages";
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
  id: "",
  name: "Custom Note",
  outline: true,
  corners: 4,
  rounding: 20,
  fill: 100,
  depth: 0.24,
  bevel: 10,
  bulge: 0,
};

const renaming = { id: "", name: "" };

const presets = [
  { name: "Rounded", corners: 4, rounding: 35, fill: 100, depth: 0.2, bevel: 0, bulge: 0 },
  { name: "Circle", corners: 4, rounding: 100, fill: 100, depth: 0.2, bevel: 0, bulge: 0 },
  { name: "Hex Ring", corners: 6, rounding: 15, fill: 30, depth: 0.25, bevel: 50, bulge: 0 },
  { name: "Pillow", corners: 4, rounding: 50, fill: 100, depth: 0.3, bevel: 80, bulge: 60 },
  { name: "Donut", corners: 14, rounding: 100, fill: 45, depth: 0.45, bevel: 100, bulge: 30 },
];

const spin = (key: string): SettingsRow =>
  gameSettingSlider(key, { format: (value) => `${Math.round(value)}°/sec` });

const grid = skinGridRows({
  favoritesKey: "noteSkinFavorites",
  placeholder: "Search skins",
  buttons: [
    {
      label: "Build",
      onClick: () => {
        draft.id = "";
        settingsNavigation.open("note-builder");
      },
    },
    {
      label: "Edit",
      onClick: () => {
        const skin = selectedNoteSkin();
        const mesh = customNoteMeshes().find((m) => m.id === skin.id);
        if (mesh) {
          Object.assign(draft, { bulge: 0 }, mesh);
          settingsNavigation.open("note-builder");
          return;
        }
        Object.assign(renaming, { id: skin.id, name: skin.name });
        settingsNavigation.open("note-rename");
      },
    },
    {
      label: "Import",
      onClick: async () => {
        const file = await pickFile({ skins: "png,obj" });
        if (file) ConfigManager.setExtra("noteSkin", addSkinFile(file.toLowerCase().endsWith(".obj") ? "meshes" : "noteskins", file));
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
  rows: () => [
    { kind: "section", label: "Note Settings" },
    spin("noteSpinX"),
    spin("noteSpinY"),
    spin("noteSpinZ"),
    gameSettingSlider("halfGhostStrength", { format: (value) => `${Math.round(value * 100)}%` }),
    gameSettingToggle("noteSpawnEffect"),
    gameSettingToggle("approachSquares"),
    gameSettingToggle("approachFollow"),
    { kind: "section", label: "Note Mesh" },
    ...grid,
  ],
});

const renameRow = textFieldRow("Name", () => renaming.name, (value) => (renaming.name = value));

registerSettingsPage({
  id: "note-rename",
  title: "Rename Note",
  subtitle: "Change this note's name",
  rows: () => [
    renameRow,
    {
      kind: "button",
      label: "Save Name",
      onClick: () => {
        const names = ConfigManager.getExtra<Record<string, string>>("noteSkinNames", {});
        ConfigManager.setExtra("noteSkinNames", { ...names, [renaming.id]: renaming.name.trim() || undefined });
        notify("Renamed");
      },
    },
  ],
});

const percent = (label: string, key: "rounding" | "fill" | "bevel" | "bulge"): SettingsRow => ({
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
    percent("Bulge", "bulge"),
    { kind: "section", label: "Presets" },
    ...presets.map(({ name, ...preset }): SettingsRow => ({
      kind: "button",
      label: name,
      half: true,
      onClick: () => Object.assign(draft, preset),
    })),
    {
      kind: "button",
      label: "Save Note",
      onClick: () => {
        const { outline, ...mesh } = draft;
        const id = mesh.id || `custom:${Date.now()}`;
        const saved: NoteMesh = { ...mesh, name: mesh.name.trim() || "Custom Note", id };
        const list = customNoteMeshes();
        ConfigManager.setExtra("customNoteMeshes", mesh.id ? list.map((m) => (m.id === id ? saved : m)) : [...list, saved]);
        ConfigManager.setExtra("noteSkin", id);
        draft.id = id;
        notify(`Saved "${saved.name}"`);
      },
    },
    ...(draft.id
      ? [
          {
            kind: "button" as const,
            label: "Delete Mesh",
            onClick: () => {
              ConfigManager.setExtra("customNoteMeshes", customNoteMeshes().filter((m) => m.id !== draft.id));
              draft.id = "";
              notify("Mesh deleted");
              settingsNavigation.open("notes");
            },
          },
        ]
      : []),
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
