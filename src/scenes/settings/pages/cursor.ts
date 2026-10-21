import {
  DrawRectangleGradientH,
  IsMouseButtonDown,
  IsMouseButtonPressed,
  MOUSE_BUTTON_LEFT,
  MOUSE_BUTTON_RIGHT,
  Vector2,
} from "raylib";
import { ConfigManager } from "../../../utils/configManager";
import { clamp } from "../../../utils/lerp";
import { drawText } from "../../../utils/text";
import { drawBorderRect, drawRect } from "../../../ui/draw";
import { PANEL } from "../../menu/atoms/BaseDrawer";
import {
  DEFAULT_TRAIL_GRADIENT,
  sampleTrailGradient,
  trailGradient,
  type TrailGradientPoint,
} from "../../game/cursorEffects/CustomCursorTrailEffect";
import {
  gameSettingSlider,
  gameSettingToggle,
  registerSettingsPage,
  type Rect,
  type SettingsRow,
} from "../pages";
import {
  choiceRows,
  fileLabel,
  gameSettingColor,
  gameSettingValue,
  listImported,
  pickFileButton,
} from "../choices";

const currentSkin = () =>
  gameSettingValue("customCursorEnabled") >= 0.5
    ? ConfigManager.get().cursorImagePath || ""
    : "";

const selectSkin = (file: string) => {
  ConfigManager.update({ cursorImagePath: file });
  ConfigManager.setGameSettings({ customCursorEnabled: file ? 1 : 0 });
};

const settingSelect = (key: string, label: string, labels: string[]): SettingsRow => ({
  kind: "select",
  label,
  options: () => labels.map((label, i) => ({ id: String(i), label })),
  get: () => String(gameSettingValue(key)),
  set: (id) => ConfigManager.setGameSettings({ [key]: Number(id) }),
});

const off = {
  cursorTrailEnabled: 0,
  cursorRainbowEnabled: 0,
  starTrailEnabled: 0,
  spaceCursorEnabled: 0,
  customCursorTrailEnabled: 0,
};

const TRAILS = [
  { id: "none", label: "None", settings: off },
  { id: "solid", label: "Solid", settings: { ...off, cursorTrailEnabled: 1 } },
  {
    id: "rainbow",
    label: "Rainbow",
    settings: { ...off, cursorTrailEnabled: 1, cursorRainbowEnabled: 1 },
  },
  {
    id: "stars",
    label: "Stars",
    settings: {
      ...off,
      cursorTrailEnabled: 1,
      cursorRainbowEnabled: 1,
      starTrailEnabled: 1,
    },
  },
  { id: "space", label: "Space", settings: { ...off, spaceCursorEnabled: 1 } },
  {
    id: "image",
    label: "Cursor Image",
    settings: { ...off, customCursorTrailEnabled: 1 },
  },
];

const currentTrail = () =>
  TRAILS.find((trail) =>
    Object.entries(trail.settings).every(
      ([key, value]) => (gameSettingValue(key) >= 0.5 ? 1 : 0) === value
    )
  );

const gradient = { selected: 0, dragging: -1 };
const saveGradient = (points: TrailGradientPoint[]) => ConfigManager.setExtra("trailGradient", points);
const barRect = (rect: Rect) => ({ x: rect.x + 8, y: rect.y + 34, w: rect.w - 16, h: 22 });
const pointAt = (rect: Rect, x: number) => {
  const bar = barRect(rect);
  const distances = trailGradient().map(([at]) => Math.abs(bar.x + at * bar.w - x));
  const nearest = distances.indexOf(Math.min(...distances));
  return distances[nearest] <= 9 ? nearest : -1;
};

const gradientBar: SettingsRow = {
  kind: "custom",
  height: () => 84,
  draw: (rect, mouse) => {
    const points = trailGradient();
    const bar = barRect(rect);
    const x = (at: number) => Math.round(bar.x + at * bar.w);
    if (!IsMouseButtonDown(MOUSE_BUTTON_LEFT)) gradient.dragging = -1;
    else if (mouse && gradient.dragging > 0) {
      const moved: TrailGradientPoint = [
        clamp((mouse.x - bar.x) / bar.w, 0.001, 0.999),
        points[gradient.dragging][1],
      ];
      if (moved[0] !== points[gradient.dragging][0]) {
        const next = points
          .map((point, i) => (i === gradient.dragging ? moved : point))
          .sort((a, b) => a[0] - b[0]);
        gradient.selected = gradient.dragging = next.indexOf(moved);
        saveGradient(next);
      }
    }
    if (mouse && IsMouseButtonPressed(MOUSE_BUTTON_RIGHT) && mouse.y >= bar.y && mouse.y <= bar.y + bar.h + 20) {
      const i = pointAt(rect, mouse.x);
      if (i > 0 && i < points.length - 1) {
        gradient.selected = i - 1;
        saveGradient(points.filter((_, index) => index !== i));
      }
    }
    drawText("click to add, drag to move, right-click to remove", Vector2(rect.x + 8, rect.y + 6), 18, PANEL.dim);
    points.slice(1).forEach(([at, color], i) =>
      DrawRectangleGradientH(x(points[i][0]), bar.y, x(at) - x(points[i][0]), bar.h, { ...points[i][1], a: 255 }, { ...color, a: 255 })
    );
    drawBorderRect(bar.x, bar.y, bar.w, bar.h, 1, PANEL.dim);
    points.forEach(([at, color], i) => {
      drawRect(x(at) - 6, bar.y + bar.h + 3, 12, 16, { ...color, a: 255 });
      drawBorderRect(x(at) - 6, bar.y + bar.h + 3, 12, 16, i === gradient.selected ? 2 : 1, i === gradient.selected ? PANEL.text : PANEL.border);
    });
  },
  click: (rect, mouse) => {
    const bar = barRect(rect);
    if (mouse.y < bar.y || mouse.y > bar.y + bar.h + 20) return false;
    const points = trailGradient();
    const i = pointAt(rect, mouse.x);
    if (i >= 0) {
      gradient.selected = i;
      gradient.dragging = i > 0 && i < points.length - 1 ? i : -1;
      return true;
    }
    const at = clamp((mouse.x - bar.x) / bar.w, 0, 1);
    const added: TrailGradientPoint = [at, sampleTrailGradient(points, at)];
    const next = [...points, added].sort((a, b) => a[0] - b[0]);
    gradient.selected = gradient.dragging = next.indexOf(added);
    saveGradient(next);
    return true;
  },
};

const selectedPoint = () => Math.min(gradient.selected, trailGradient().length - 1);

const chromiaTrailRows = (): SettingsRow[] => [
  gameSettingToggle("smartTrail"),
  settingSelect("trailFadeMode", "Trail Fade Mode", ["Normal", "Scale only", "Opacity only"]),
  gameSettingSlider("trailDetail"),
  gameSettingSlider("trailTime"),
  gameSettingSlider("trailOpacity", {
    min: 0,
    max: 100,
    step: 5,
    defaultValue: 100,
    get: () => gameSettingValue("trailOpacity") * 100,
    set: (value) => ConfigManager.setGameSettings({ trailOpacity: value / 100 }),
    format: (value) => `${Math.round(value)}%`,
    maxLabel: "100%",
  }),
  { kind: "section", label: "Trail Gradient" },
  gameSettingToggle("trailGradientEnabled"),
  ...(gameSettingValue("trailGradientEnabled") >= 0.5
    ? [
        gradientBar,
        {
          kind: "color",
          label: "Point Color",
          get: () => trailGradient()[selectedPoint()][1],
          set: (color) =>
            saveGradient(
              trailGradient().map((point, i): TrailGradientPoint => (i === selectedPoint() ? [point[0], color] : point))
            ),
        } satisfies SettingsRow,
        {
          kind: "button",
          label: "Reset gradient",
          onClick: () => {
            gradient.selected = 0;
            saveGradient(DEFAULT_TRAIL_GRADIENT);
          },
        } satisfies SettingsRow,
      ]
    : []),
];

registerSettingsPage({
  id: "cursor",
  title: "Cursor",
  subtitle: "Cursor behavior and feel",
  icon: "/icons/cursor-text.png",
  group: "General",
  rows: () => [
    {
      kind: "link",
      label: "Cursor Skin",
      icon: "/icons/cursor-text.png",
      page: "cursor-skin",
      value: () => (currentSkin() ? fileLabel(currentSkin()) : "Default"),
      half: true,
    },
    {
      kind: "link",
      label: "Cursor Trail",
      icon: "/icons/sparkles.png",
      page: "cursor-trail",
      value: () => currentTrail()?.label ?? "Custom",
      half: true,
    },
    settingSelect("cursorColorMode", "Color Mode", ["Single Color", "Rainbow", "Note Color"]),
    gameSettingColor(
      "Cursor Color",
      ["cursorColorRed", "cursorColorGreen", "cursorColorBlue"],
      {
        opacity: {
          get: () => gameSettingValue("cursorOpacity"),
          set: (value) => ConfigManager.setGameSettings({ cursorOpacity: value }),
        },
      }
    ),
    gameSettingSlider("mouseSensitivity", {
      label: "Cursor Sensitivity",
      step: 0.001,
    }),
    gameSettingSlider("cursorScale", { max: 6, step: 0.01 }),
    gameSettingSlider("cursorRotation", {
      label: "Cursor Spin (deg/sec)",
      min: -3600,
      max: 3600,
      step: 1,
      get: () => gameSettingValue("cursorRotation") * 72,
      set: (value) => ConfigManager.setGameSettings({ cursorRotation: value / 72 }),
    }),
    gameSettingToggle("cursorFaceVelocity"),
    {
      kind: "toggle",
      label: "Cursor Mode",
      get: () => ConfigManager.get().useRelativeCursor,
      set: (value) => ConfigManager.setUseRelativeCursor(value),
      defaultValue: true,
      onLabel: "Relative",
      offLabel: "Absolute",
    },
    gameSettingSlider("mouseBoundRate", {
      label: "Edge Buffer (drift)",
      min: -0.3,
      max: 1,
      defaultValue: 0,
      get: () => gameSettingValue("mouseBoundRate") - 1,
      set: (value) => ConfigManager.setGameSettings({ mouseBoundRate: value + 1 }),
    }),
  ],
});

registerSettingsPage({
  id: "cursor-skin",
  title: "Cursor Skin",
  subtitle: "Choose or import a cursor image",
  icon: "/icons/cursor-text.png",
  rows: () => [
    ...choiceRows(
      [
        { id: "", label: "Default" },
        ...listImported("cursors", ConfigManager.get().cursorImagePath),
      ],
      currentSkin,
      selectSkin
    ),
    pickFileButton(
      "Import cursor image",
      { images: "png,jpg,jpeg" },
      selectSkin,
      "cursors"
    ),
  ],
});

registerSettingsPage({
  id: "cursor-trail",
  title: "Cursor Trail",
  subtitle: "Choose a cursor trail",
  icon: "/icons/sparkles.png",
  rows: () => [
    ...choiceRows(TRAILS, () => currentTrail()?.id ?? "", (id) =>
      ConfigManager.setGameSettings(TRAILS.find((trail) => trail.id === id)!.settings)
    ),
    { kind: "section", label: "Options" },
    ...(currentTrail()?.id === "image"
      ? chromiaTrailRows()
      : [gameSettingSlider("cursorTrailFadeRate"), gameSettingSlider("rainbowRate")]),
  ],
});
