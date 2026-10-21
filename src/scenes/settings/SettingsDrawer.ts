import {
  Vector2,
  IsMouseButtonDown,
  MOUSE_BUTTON_LEFT,
  BeginScissorMode,
  EndScissorMode,
  DrawRectangleGradientH,
  DrawRectangleGradientV,
  rlPushMatrix,
  rlPopMatrix,
  rlTranslatef,
  rlRotatef,
  rlScalef,
} from "raylib";
import * as fs from "fs";
import * as path from "path";
import { exec } from "child_process";
import { openDialog } from "nativefiledialog";
import { ScrollableDrawer } from "../menu/atoms/ScrollableDrawer";
import { PANEL } from "../menu/atoms/BaseDrawer";
import { createInputBox, InputBox, InputBoxProps } from "../menu/atoms/InputBox";
import { createPopup } from "../menu/atoms/Popup";
import { GamePreview } from "../customization/atoms/GamePreview";
import { getSettingsPage, hasFlag, listSettingsPages, registerSettingsPage, settingsNavigation, toggleFlag, Rect, RGB, SettingsRow } from "./pages";
import { choiceRows } from "./choices";
import { ConfigManager } from "../../utils/configManager";
import { GAME_SETTINGS_SCHEMA, toGameConfigKey } from "../../utils/gameSettingsSchema";
import { drawRect, drawBorderRect } from "../../ui/draw";
import { drawSprite, removeTextureFromCache } from "../../utils/sprite";
import { drawText, measureText } from "../../utils/text";
import { inRect } from "../../utils/geometry";
import { clamp } from "../../utils/lerp";
import { isMusicPlaying, pause, playFx, playMusic } from "../../utils/soundManager";
import { getPresentationInfo } from "../../atoms/sysutils/rendering";
import { Rhythia } from "../../atoms/Rhythia";
import { Maps } from "../../utils/maps";
import { toastManager } from "../../utils/toastManager";
import type { SoundSpaceMemoryMap } from "../../utils/storage/ssmm";
import { getReplaysDir } from "../../utils/replays";
import { restartAppInPlace } from "../../atoms/sysutils/scenes";

type Labeled = Extract<SettingsRow, { label: string }>;
type Slider = Extract<SettingsRow, { kind: "slider" }>;
type ColorRow = Extract<SettingsRow, { kind: "color" }>;

const FIELD = { r: 30, g: 30, b: 33, a: 255 };
const ICON_BOX = { r: 36, g: 34, b: 58, a: 255 };
const ICON_TINT = { r: 185, g: 180, b: 235, a: 255 };
const TRACK = { r: 60, g: 60, b: 64, a: 255 };
const FILL = { r: 205, g: 205, b: 210, a: 255 };
const PREVIEW: Rect = { x: 778, y: 213, w: 1040, h: 585 };
const HEIGHTS = { section: 60, slider: 104, toggle: 100, select: 104, link: 78, button: 48 };
const GAP = 10;

const hit = (m: Vector2 | null, r: Rect) => !!m && inRect(m.x, m.y, r.x, r.y, r.w, r.h);
const sameRgb = (a: RGB, b: RGB) => a.r === b.r && a.g === b.g && a.b === b.b;
const short = (n: number) => String(+n.toFixed(3));
const formatValue = (row: Slider, v: number) =>
  row.format?.(v) ?? v.toFixed(row.step >= 1 ? 0 : Math.max(2, (String(row.step).split(".")[1] ?? "").length));

const hsvToRgb = ([h, s, v]: number[]): RGB => {
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return Math.round(255 * (v - v * s * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return { r: f(5), g: f(3), b: f(1) };
};

const rgbToHsv = ({ r, g, b }: RGB): number[] => {
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  const h = d === 0 ? 0 : max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, max ? d / max : 0, max / 255];
};

const openFolder = (dir: string) =>
  exec(process.platform === "win32" ? `explorer "${dir}"` : process.platform === "darwin" ? `open "${dir}"` : `xdg-open "${dir}"`);

const fit = (text: string, size: number, maxWidth: number) => {
  let out = text;
  while (out.length > 1 && measureText(`...${out}`, size).width > maxWidth) out = out.slice(1);
  return out === text ? text : `...${out}`;
};

export function drawCard(rect: Rect, hovered = false): void {
  drawRect(rect.x, rect.y, rect.w, rect.h, hovered ? PANEL.cardHover : PANEL.card);
  drawBorderRect(rect.x, rect.y, rect.w, rect.h, 2, PANEL.border);
}

export function drawField(rect: Rect, text: string, align: "left" | "center" = "left", size = 18, hovered = false): void {
  drawRect(rect.x, rect.y, rect.w, rect.h, hovered ? PANEL.cardHover : FIELD);
  const x = align === "center" ? rect.x + rect.w / 2 : rect.x + 10;
  drawText(text, Vector2(x, rect.y + (rect.h - size) / 2), size, PANEL.text, align);
}

function drawKnob(x: number, y: number, size: number, color: RGB): void {
  drawSprite("/circle.png", Vector2(x - size / 2, y - size / 2), Vector2(size, size), PANEL.text);
  drawSprite("/circle.png", Vector2(x - size / 2 + 3, y - size / 2 + 3), Vector2(size - 6, size - 6), { ...color, a: 255 });
}

function drawPill(rect: Rect, color: { r: number; g: number; b: number; a: number }): void {
  const d = rect.h;
  drawSprite("/circle.png", Vector2(rect.x, rect.y), Vector2(d, d), color);
  drawSprite("/circle.png", Vector2(rect.x + rect.w - d, rect.y), Vector2(d, d), color);
  drawRect(rect.x + d / 2, rect.y, rect.w - d, d, color);
}

export class SettingsDrawer extends ScrollableDrawer {
  private stack: string[] = ["home"];
  private hits: { rect: Rect; row: SettingsRow }[] = [];
  private inputs = new Map<string, { box: InputBox; seen: boolean }>();
  private drag: { row: SettingsRow; part: "slider" | "sv" | "hue" | "alpha"; rect: Rect } | null = null;
  private hsv = new Map<string, number[]>();
  private editing: string | null = null;
  private openSelect: string | null = null;
  private query = "";
  private profiles = ConfigManager.getProfiles();
  private preview: GamePreview | null = null;
  private previewMap: SoundSpaceMemoryMap | null = null;
  private resumedMusic = false;

  constructor(private getSelectedMap: () => SoundSpaceMemoryMap | null) {
    super();
    settingsNavigation.open = (id) => this.navigate(id);
    registerSettingsPage({
      id: "presets",
      title: "Presets",
      subtitle: "Switch or create settings profiles",
      rows: () => [
        ...choiceRows(
          this.profiles.map(({ id, name }) => ({ id, label: name })),
          () => ConfigManager.getActiveProfileId(),
          (id) => ConfigManager.applyProfile(id)
        ),
        { kind: "button", label: "Create New From Current", onClick: () => this.createProfile() },
      ],
    });
  }

  private get page() {
    return getSettingsPage(this.stack[this.stack.length - 1]);
  }

  private navigate(id: string): void {
    this.stack.push(id);
    this.resetPage();
  }

  private resetPage(): void {
    this.resetScrollState();
    this.editing = this.openSelect = this.drag = null;
  }

  protected getHeaderText(): string {
    return this.stack.map((id) => getSettingsPage(id)?.title ?? "Settings").join(" > ");
  }

  protected getSubtitleText(): string {
    return this.page?.subtitle ?? "Game Settings and Customizations";
  }

  protected canGoBack(): boolean {
    return this.stack.length > 1;
  }

  protected onBack(): void {
    this.stack.pop();
    this.resetPage();
  }

  protected getScrollAreaTop(): number {
    return this.getContentRect().y;
  }

  protected getScrollAreaBottomPadding(): number {
    return PANEL.bottom;
  }

  protected getScrollTrackX(): number {
    const content = this.getContentRect();
    return content.x + content.w - 12;
  }

  public open(): void {
    super.open();
    this.profiles = ConfigManager.getProfiles();
    const dir = "./cache/parsed";
    const map =
      this.getSelectedMap() ??
      this.previewMap ??
      Maps.getParsed("10291") ??
      (fs.existsSync(dir) ? Maps.getParsed(fs.readdirSync(dir)[0] ?? "") : null);
    if (map && map !== this.previewMap) {
      this.preview?.destroy();
      this.preview = new GamePreview({ mapData: map, drawerWidth: 0 });
      this.previewMap = map;
    }
    if (map && !isMusicPlaying()) {
      playMusic(Maps.audioPath(String(map.id), map)!);
      this.resumedMusic = true;
    }
  }

  public close(): void {
    super.close();
    if (this.resumedMusic) pause();
    this.resumedMusic = false;
    this.inputs.forEach(({ box }) => box.destroy());
    this.inputs.clear();
    this.resetPage();
  }

  private rows(): SettingsRow[] {
    const showLocked = ConfigManager.getExtra("settingsShowLocked", false);
    return (this.page?.rows() ?? this.homeRows()).filter(
      (row) => showLocked || row.kind !== "slider" || !hasFlag("settingsLocked", row.label)
    );
  }

  private homeRows(): SettingsRow[] {
    const query = this.query.trim().toLowerCase();
    const pages = listSettingsPages().filter((page) => page.id !== "favorites" || !query);
    const head: SettingsRow[] = [
      {
        kind: "custom",
        height: () => 34,
        draw: (rect, mouse) => this.drawProfile(rect, mouse),
        click: (rect, mouse) => this.clickProfile(rect, mouse),
      },
      {
        kind: "custom",
        height: () => 104,
        draw: (rect, mouse) =>
          this.actions(rect).forEach(({ label, rect: r, active }) => {
            drawField(r, label, "center", 15, active || hit(mouse, r));
            if (active) drawBorderRect(r.x, r.y, r.w, r.h, 1, PANEL.dim);
          }),
        click: (rect, mouse) => {
          const action = this.actions(rect).find((a) => hit(mouse, a.rect));
          action?.run();
          return !!action;
        },
      },
      {
        kind: "custom",
        height: () => 40,
        draw: (rect) =>
          this.field("search", rect, {
            placeholder: "Search settings",
            initialValue: this.query,
            onValueChange: (value) => {
              this.query = value;
            },
          }),
      },
    ];
    if (query) {
      return [
        ...head,
        ...pages.flatMap((page) => [
          ...(page.icon && page.title.toLowerCase().includes(query)
            ? [{ kind: "link", label: page.title, icon: page.icon, page: page.id } as SettingsRow]
            : []),
          ...page.rows().filter((row) => "label" in row && row.kind !== "section" && row.label.toLowerCase().includes(query)),
        ]),
      ];
    }
    return [
      ...head,
      ...(["General", "Skinning"] as const).flatMap((group): SettingsRow[] => [
        { kind: "section", label: group },
        ...pages
          .filter((page) => page.group === group)
          .map((page): SettingsRow => ({ kind: "link", label: page.title, icon: page.icon ?? "/icons/settings.png", page: page.id, half: true })),
      ]),
    ];
  }

  private profileParts(rect: Rect) {
    const button = (i: number): Rect => ({ x: rect.x + rect.w - 34 - i * 43, y: rect.y, w: 34, h: rect.h });
    return { name: { ...rect, w: rect.w - 139 }, rename: button(2), add: button(1), remove: button(0) };
  }

  private drawProfile(rect: Rect, mouse: Vector2 | null): void {
    const parts = this.profileParts(rect);
    const active = this.profiles.find((p) => p.id === ConfigManager.get().activeProfileId);
    drawField(parts.name, active?.name ?? "Default", "left", 18, hit(mouse, parts.name));
    (
      [
        [parts.rename, "/icons/pencil.png"],
        [parts.add, "/icons/plus.png"],
        [parts.remove, "/icons/minus.png"],
      ] as const
    ).forEach(([r, icon]) => {
      drawRect(r.x, r.y, r.w, r.h, hit(mouse, r) ? PANEL.cardHover : FIELD);
      drawSprite(icon, Vector2(r.x + 8, r.y + 8), Vector2(18, 18), PANEL.text);
    });
  }

  private clickProfile(rect: Rect, mouse: Vector2): boolean {
    const parts = this.profileParts(rect);
    const activeId = ConfigManager.get().activeProfileId;
    const index = this.profiles.findIndex((p) => p.id === activeId);
    const refresh = () => (this.profiles = ConfigManager.getProfiles());
    if (hit(mouse, parts.name)) {
      ConfigManager.applyProfile(this.profiles[(index + 1) % this.profiles.length].id);
    } else if (hit(mouse, parts.rename)) {
      createPopup("prompt").showPrompt({
        message: "Rename profile",
        initialValue: this.profiles[index]?.name ?? "",
        placeholder: "Profile name",
        onConfirm: (value) => {
          ConfigManager.renameProfile(activeId, value);
          refresh();
        },
      });
    } else if (hit(mouse, parts.add)) {
      this.createProfile();
    } else if (hit(mouse, parts.remove)) {
      if (activeId === "default") toastManager.show("The default profile can't be removed");
      else
        createPopup("confirm").showConfirm({
          message: `Remove profile ${this.profiles[index]?.name}?`,
          confirmText: "Remove",
          onConfirm: () => {
            ConfigManager.removeProfile(activeId);
            refresh();
          },
        });
    } else return false;
    return true;
  }

  private createProfile(): void {
    createPopup("prompt").showPrompt({
      message: "New profile",
      initialValue: "",
      placeholder: "Profile name",
      onConfirm: (value) => {
        ConfigManager.createProfile(value.trim() || "Profile");
        this.profiles = ConfigManager.getProfiles();
      },
    });
  }

  private actions(rect: Rect) {
    const w = (rect.w - 16) / 3;
    const showLocked = ConfigManager.getExtra("settingsShowLocked", false);
    const failed = () => toastManager.show("Import failed");
    return [
      { label: "Export settings", active: false, run: () => this.exportSettings() },
      { label: "Import settings", active: false, run: () => void this.importSettings().catch(failed) },
      { label: "Show locked", active: showLocked, run: () => ConfigManager.setExtra("settingsShowLocked", !showLocked) },
      { label: "Import files", active: false, run: () => void this.importFiles().catch(failed) },
      { label: "Presets", active: false, run: () => this.navigate("presets") },
      { label: "Open user folder", active: false, run: () => openFolder(ConfigManager.getAppDataDir()) },
      { label: "Open replay folder", active: false, run: () => openFolder(getReplaysDir()) },
      {
        label: "Reload content",
        active: false,
        run: () =>
          createPopup("confirm").showConfirm({
            message: "Reload all maps and skins?",
            confirmText: "OK",
            onConfirm: () => void restartAppInPlace(),
          }),
      },
    ].map((action, i) => ({ ...action, rect: { x: rect.x + (i % 3) * (w + 8), y: rect.y + Math.floor(i / 3) * 38, w, h: 28 } }));
  }

  private exportSettings(): void {
    const file = path.resolve("rhythia-settings.json");
    fs.writeFileSync(file, JSON.stringify(ConfigManager.get(), null, 2));
    toastManager.show(`Settings exported to ${file}`);
  }

  private async importSettings(): Promise<void> {
    const file: string | null = await openDialog({ settings: "json" });
    if (!file) return;
    const { activeProfileId, ...settings } = JSON.parse(fs.readFileSync(file, "utf8"));
    ConfigManager.update(settings);
    ConfigManager.save();
    toastManager.show("Settings imported");
  }

  private async importFiles(): Promise<void> {
    const file: string | null = await openDialog({ files: "sspm,rhm,png,jpg,jpeg" });
    if (!file) return;
    const ext = path.extname(file).toLowerCase();
    if (ext === ".sspm" || ext === ".rhm") {
      await Maps.ensure();
      const map = await Maps.importBuffer(fs.readFileSync(file));
      return toastManager.show(map ? `Imported ${map.title}` : "Failed to import map");
    }
    if (![".png", ".jpg", ".jpeg"].includes(ext)) return toastManager.show("Unsupported file");
    const use = (update: { cursorImagePath?: string; coverImagePath?: string }, textures: string[], message: string) => () => {
      ConfigManager.update(update);
      ConfigManager.save();
      textures.forEach((texture) => removeTextureFromCache(texture));
      toastManager.show(message);
    };
    createPopup("confirm").showConfirm({
      message: "Use this image as",
      confirmText: "Cursor",
      cancelText: "Cover",
      onConfirm: use({ cursorImagePath: file }, ["custom-cursor-texture", `${file}-custom-cursor-image`], "Cursor image set"),
      onCancel: use({ coverImagePath: file }, ["custom-background-image"], "Cover image set"),
    });
  }

  private field(key: string, rect: Rect, props: Partial<InputBoxProps>, focus = false): void {
    if (!this.isOpen) return;
    const content = this.getContentRect();
    const visible = rect.y >= content.y && rect.y + rect.h <= content.y + content.h;
    let entry = this.inputs.get(key);
    if (!entry) {
      const box = createInputBox({ position: Vector2(0, 0), width: rect.w, height: rect.h, fontSize: 18, ...props });
      box.getGameObject().zBase = 16;
      box.setAccentColor(this.accentColor);
      if (focus) box.focus();
      entry = { box, seen: true };
      this.inputs.set(key, entry);
    }
    entry.seen = true;
    const x = visible ? rect.x + this.gameObject.rectArea!.pos.x : -4000;
    entry.box.setGeometry(Vector2(x, rect.y + rect.h / 2), rect.w, rect.h);
  }

  private heightOf(row: SettingsRow): number {
    if (row.kind === "custom") return row.height();
    if (row.kind === "color") return row.opacity ? 228 : 196;
    if (row.kind === "select" && this.openSelect === row.label) return 108 + row.options().length * 38;
    return HEIGHTS[row.kind];
  }

  private parts(row: Labeled, rect: Rect) {
    const reset = this.canReset(row) ? { x: rect.x + rect.w - 46, y: rect.y + 11, w: 34, h: 36 } : null;
    const valueW = row.kind === "color" ? 122 : row.kind === "slider" ? Math.max(74, measureText(formatValue(row, row.get()), 18).width + 20) : 74;
    const labelEnd = rect.x + 14 + measureText(row.label, 22).width;
    return {
      reset,
      value: { x: (reset ? reset.x - 10 : rect.x + rect.w - 12) - valueW, y: rect.y + 11, w: valueW, h: 36 },
      lock: { x: labelEnd + 12, y: rect.y + 19, w: 18, h: 18 },
      heart: { x: labelEnd + 38, y: rect.y + 19, w: 18, h: 18 },
      pill: { x: rect.x + 13, y: rect.y + 51, w: 66, h: 33 },
      field: { x: rect.x + 13, y: rect.y + 57, w: rect.w - 26, h: 36 },
      sv: { x: rect.x + 15, y: rect.y + 56, w: rect.w - 30, h: 100 },
      hue: { x: rect.x + 15, y: rect.y + 164, w: rect.w - 30, h: 16 },
    };
  }

  private track(rect: Rect, centerY: number, min: string, max: string): Rect {
    const left = rect.x + 32 + measureText(min, 18).width;
    return { x: left, y: centerY - 12, w: rect.x + rect.w - 32 - measureText(max, 18).width - left, h: 24 };
  }

  private sliderTrack(row: Slider, rect: Rect): Rect {
    return this.track(rect, rect.y + 73, short(row.min), row.maxLabel ?? short(row.max));
  }

  private alphaTrack(rect: Rect): Rect {
    return this.track(rect, rect.y + 200, "0%", "100%");
  }

  private optionRect(rect: Rect, i: number): Rect {
    return { x: rect.x + 13, y: rect.y + 100 + i * 38, w: rect.w - 26, h: 34 };
  }

  private canReset(row: Labeled): boolean {
    return "defaultValue" in row && row.defaultValue !== undefined && JSON.stringify(row.get()) !== JSON.stringify(row.defaultValue);
  }

  private hsvOf(row: ColorRow): number[] {
    const cached = this.hsv.get(row.label);
    if (cached && sameRgb(hsvToRgb(cached), row.get())) return cached;
    const fresh = rgbToHsv(row.get());
    this.hsv.set(row.label, fresh);
    return fresh;
  }

  private drawSlider(rect: Rect, track: Rect, min: string, max: string, ratio: number): void {
    const centerY = track.y + track.h / 2;
    drawText(min, Vector2(rect.x + 18, centerY - 9), 18, PANEL.text);
    drawText(max, Vector2(rect.x + rect.w - 18, centerY - 9), 18, PANEL.text, "right");
    drawRect(track.x, centerY - 2, track.w, 4, TRACK);
    drawRect(track.x, centerY - 2, track.w * ratio, 4, FILL);
    drawSprite("/circle.png", Vector2(track.x + track.w * ratio - 10, centerY - 10), Vector2(20, 20), PANEL.text);
  }

  private drawRow(row: SettingsRow, rect: Rect, mouse: Vector2 | null): void {
    const hovered = hit(mouse, rect);
    if (row.kind === "custom") return row.draw(rect, mouse);
    if (row.kind === "section") {
      drawText(row.label, Vector2(rect.x + 1, rect.y + 14), 26, PANEL.text);
      drawRect(rect.x, rect.y + 50, rect.w, 2, { r: 62, g: 62, b: 68, a: 255 });
      return;
    }
    drawCard(rect, hovered && (row.kind === "link" || row.kind === "button"));
    if (row.kind === "button") {
      drawText(row.label, Vector2(rect.x + rect.w / 2, rect.y + 14), 20, PANEL.text, "center");
      return;
    }
    if (row.kind === "link") {
      const iconY = rect.y + (rect.h - 45) / 2;
      const chevronX = rect.x + rect.w - 38;
      drawRect(rect.x + 18, iconY, 45, 45, ICON_BOX);
      drawSprite(row.icon, Vector2(rect.x + 25, iconY + 7), Vector2(31, 31), ICON_TINT);
      drawText(row.label, Vector2(rect.x + 74, rect.y + rect.h / 2 - 12), 22, PANEL.text);
      drawSprite("/icons/chevron-right.png", Vector2(chevronX, rect.y + rect.h / 2 - 10), Vector2(20, 20), PANEL.text);
      const value = row.value?.();
      const labelEnd = rect.x + 90 + measureText(row.label, 22).width;
      if (value) drawText(fit(value, 18, chevronX - 8 - labelEnd), Vector2(chevronX - 8, rect.y + rect.h / 2 - 10), 18, PANEL.dim, "right");
      return;
    }

    const parts = this.parts(row, rect);
    drawText(row.label, Vector2(rect.x + 14, rect.y + 18), 22, PANEL.text);
    if (parts.reset) {
      const r = parts.reset;
      drawRect(r.x, r.y, r.w, r.h, hit(mouse, r) ? PANEL.cardHover : FIELD);
      drawSprite("/icons/arrow-back-up.png", Vector2(r.x + 8, r.y + 9), Vector2(18, 18), PANEL.text);
    }

    if (row.kind === "slider") {
      const value = row.get();
      const locked = hasFlag("settingsLocked", row.label);
      const favorite = hasFlag("settingsFavorites", row.label);
      if (hovered || locked) drawSprite(locked ? "/icons/lock.png" : "/icons/lock-open.png", Vector2(parts.lock.x, parts.lock.y), Vector2(18, 18), locked ? PANEL.text : PANEL.dim);
      if (hovered || favorite) drawSprite("/icons/heart.png", Vector2(parts.heart.x, parts.heart.y), Vector2(18, 18), favorite ? { r: 240, g: 90, b: 120, a: 255 } : PANEL.dim);
      if (this.editing === row.label) {
        this.field(`value:${row.label}`, parts.value, {
          initialValue: formatValue(row, value),
          maxLength: 12,
          onValueChange: (text) => {
            const parsed = Number.parseFloat(text);
            if (Number.isFinite(parsed)) row.set(clamp(parsed, row.min, row.max));
          },
          onEnter: () => (this.editing = null),
          onBlur: () => (this.editing = null),
        }, true);
      } else drawField(parts.value, formatValue(row, value), "left", 18, hit(mouse, parts.value));
      this.drawSlider(rect, this.sliderTrack(row, rect), short(row.min), row.maxLabel ?? short(row.max), (value - row.min) / (row.max - row.min || 1));
    } else if (row.kind === "toggle") {
      const on = row.get();
      const pill = parts.pill;
      drawPill(pill, on ? { r: 92, g: 92, b: 98, a: 255 } : { r: 44, g: 44, b: 48, a: 255 });
      drawSprite("/circle.png", Vector2(on ? pill.x + pill.w - 30 : pill.x + 4, pill.y + 3.5), Vector2(26, 26), PANEL.text);
      drawText(on ? row.onLabel ?? "On" : row.offLabel ?? "Off", Vector2(pill.x + pill.w + 11, pill.y + 7), 18, PANEL.text);
    } else if (row.kind === "select") {
      const options = row.options();
      const current = row.get();
      drawField(parts.field, options.find((o) => o.id === current)?.label ?? current, "left", 18, hit(mouse, parts.field));
      drawText(">", Vector2(parts.field.x + parts.field.w - 12, parts.field.y + 9), 18, PANEL.text, "right");
      if (this.openSelect === row.label)
        options.forEach((option, i) => {
          const r = this.optionRect(rect, i);
          drawField(r, option.label, "left", 18, option.id === current || hit(mouse, r));
        });
    } else if (row.kind === "color") {
      const color = row.get();
      const [h, s, v] = this.hsvOf(row);
      const { sv, hue } = parts;
      drawField(parts.value, `${color.r},${color.g},${color.b}`);
      DrawRectangleGradientH(sv.x, sv.y, sv.w, sv.h, PANEL.text, { ...hsvToRgb([h, 1, 1]), a: 255 });
      DrawRectangleGradientV(sv.x, sv.y, sv.w, sv.h, { r: 0, g: 0, b: 0, a: 0 }, { r: 0, g: 0, b: 0, a: 255 });
      for (let i = 0; i < 6; i++) {
        const x0 = Math.round(hue.x + (hue.w * i) / 6);
        const x1 = Math.round(hue.x + (hue.w * (i + 1)) / 6);
        DrawRectangleGradientH(x0, hue.y, x1 - x0, hue.h, { ...hsvToRgb([i * 60, 1, 1]), a: 255 }, { ...hsvToRgb([(i + 1) * 60, 1, 1]), a: 255 });
      }
      drawKnob(sv.x + s * sv.w, sv.y + (1 - v) * sv.h, 14, color);
      drawKnob(hue.x + (h / 360) * hue.w, hue.y + hue.h / 2, 18, hsvToRgb([h, 1, 1]));
      if (row.opacity) this.drawSlider(rect, this.alphaTrack(rect), "0%", "100%", row.opacity.get());
    }
  }

  private clickRow(row: SettingsRow, rect: Rect, mouse: Vector2): void {
    if (row.kind === "custom") {
      row.click?.(rect, mouse);
      return;
    }
    if (row.kind === "section") return;
    if (row.kind === "link" || row.kind === "button" || row.kind === "toggle") playFx("/hover.wav");
    if (row.kind === "link") return this.navigate(row.page);
    if (row.kind === "button") return row.onClick();
    const parts = this.parts(row, rect);
    if (row.kind === "slider" && hit(mouse, parts.lock)) return toggleFlag("settingsLocked", row.label);
    if (row.kind === "slider" && hit(mouse, parts.heart)) return toggleFlag("settingsFavorites", row.label);
    if (hasFlag("settingsLocked", row.label)) return;
    if (parts.reset && hit(mouse, parts.reset) && "defaultValue" in row) {
      return (row.set as (value: unknown) => void)(row.defaultValue);
    }
    if (row.kind === "toggle") return row.set(!row.get());
    if (row.kind === "select") {
      const options = row.options();
      const index = options.findIndex((_, i) => hit(mouse, this.optionRect(rect, i)));
      if (this.openSelect === row.label && index >= 0) row.set(options[index].id);
      this.openSelect = this.openSelect !== row.label && hit(mouse, parts.field) ? row.label : null;
      return;
    }
    if (row.kind === "slider") {
      const track = this.sliderTrack(row, rect);
      if (hit(mouse, parts.value)) this.editing = row.label;
      else if (hit(mouse, track)) this.drag = { row, part: "slider", rect: track };
      return;
    }
    const alpha = this.alphaTrack(rect);
    if (hit(mouse, parts.sv)) this.drag = { row, part: "sv", rect: parts.sv };
    else if (hit(mouse, parts.hue)) this.drag = { row, part: "hue", rect: parts.hue };
    else if (row.opacity && hit(mouse, alpha)) this.drag = { row, part: "alpha", rect: alpha };
  }

  protected onDrawerClick(mousePos: Vector2 | null): boolean {
    const content = this.getContentRect();
    const mouse = mousePos && Vector2(mousePos.x - this.gameObject.rectArea!.pos.x, mousePos.y);
    if (!hit(mouse, content) || this.suppressButtonReleaseClickFrames > 0) return true;
    const target = this.hits.find((h) => hit(mouse, h.rect));
    this.editing = null;
    if (!target) this.openSelect = null;
    else this.clickRow(target.row, target.rect, mouse!);
    return true;
  }

  protected onOverlayClick(): boolean {
    return !hit(this.overlayObject.getMousePosition(), PREVIEW);
  }

  protected onUpdate(): void {
    if (!this.isOpen) return;
    const mouse = this.gameObject.getMousePosition();
    this.updateScroll(mouse);
    if (!this.drag) return;
    if (!mouse || !IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
      this.drag = null;
      return;
    }
    const { row, part, rect } = this.drag;
    const tx = clamp((mouse.x - this.gameObject.rectArea!.pos.x - rect.x) / rect.w, 0, 1);
    const ty = clamp((mouse.y - rect.y) / rect.h, 0, 1);
    if (row.kind === "slider") {
      const value = +clamp(row.min + Math.round((tx * (row.max - row.min)) / row.step) * row.step, row.min, row.max).toFixed(6);
      if (value !== row.get()) row.set(value);
    } else if (row.kind === "color" && part === "alpha") {
      row.opacity!.set(+tx.toFixed(2));
    } else if (row.kind === "color") {
      const [h, s, v] = this.hsvOf(row);
      const next = part === "hue" ? [tx * 360, s, v] : [h, tx, 1 - ty];
      this.hsv.set(row.label, next);
      if (!sameRgb(hsvToRgb(next), row.get())) row.set(hsvToRgb(next));
    }
  }

  private scissor(rect: Rect): void {
    const { viewport } = getPresentationInfo();
    const sx = viewport.width / Rhythia.gameWidth;
    const sy = viewport.height / Rhythia.gameHeight;
    const x = rect.x + this.gameObject.rectArea!.pos.x;
    BeginScissorMode(Math.round(viewport.x + x * sx), Math.round(viewport.y + rect.y * sy), Math.round(rect.w * sx), Math.round(rect.h * sy));
  }

  protected drawContent(): void {
    const content = this.getContentRect();
    const raw = this.gameObject.getMousePosition();
    const shifted = raw && Vector2(raw.x - this.gameObject.rectArea!.pos.x, raw.y);
    const mouse = hit(shifted, content) && !this.drag ? shifted : null;
    const x = content.x + 17;
    const w = content.w - 35;
    const halfW = (w - 8) / 2;
    let y = content.y + PANEL.padding - this.scrollOffset;
    let column = 0;
    let lastHeight = 0;
    this.hits = [];
    this.scissor({ x: content.x + 2, y: content.y + 2, w: content.w - 4, h: content.h - 4 });
    for (const row of this.rows()) {
      const half = "half" in row && !!row.half;
      if (column && !half) {
        y += lastHeight + GAP;
        column = 0;
      }
      const h = this.heightOf(row);
      const rect = { x: x + column * (halfW + 8), y, w: half ? halfW : w, h };
      if (y + h > content.y && y < content.y + content.h) {
        this.drawRow(row, rect, mouse);
        this.hits.push({ rect, row });
      }
      if (half && !column) {
        column = 1;
        lastHeight = h;
      } else {
        y += h + GAP;
        column = 0;
      }
    }
    if (column) y += lastHeight + GAP;
    EndScissorMode();
    this.maxScrollOffset = Math.max(0, y + this.scrollOffset - GAP + PANEL.padding - content.y - content.h);
    this.inputs.forEach((entry, key) => {
      if (!entry.seen) {
        entry.box.destroy();
        this.inputs.delete(key);
      }
      entry.seen = false;
    });
    this.renderScrollbar();
    this.drawPreview();
  }

  private drawPreview(): void {
    const r = PREVIEW;
    drawRect(r.x - 2, r.y - 2, r.w + 4, r.h + 4, { r: 200, g: 200, b: 205, a: 255 });
    drawRect(r.x, r.y, r.w, r.h, { r: 0, g: 0, b: 0, a: 255 });
    this.scissor(r);
    if (this.page?.drawPreview) this.page.drawPreview(r);
    else if (this.preview) {
      const config = ConfigManager.get() as unknown as Record<string, number>;
      const s = r.w / Rhythia.gameWidth;
      const depth = Math.abs(Rhythia.camera.position.z);
      const kx = (r.x + this.gameObject.rectArea!.pos.x + ((s - 1) * Rhythia.gameWidth) / 2) / depth;
      const ky = (r.y + ((s - 1) * Rhythia.gameHeight) / 2) / depth;
      const k = Math.hypot(kx, ky);
      const q = Math.sqrt(1 + (k * k) / 4);
      const angle = (Math.atan2(ky, kx) * 180) / Math.PI;
      const shear = (Math.atan(k / 2) * 180) / Math.PI;
      rlPushMatrix();
      rlTranslatef(r.x, r.y, 0);
      rlRotatef(angle, 0, 0, 1);
      rlRotatef((shear - 90) / 2, 0, 1, 0);
      rlScalef(q + k / 2, 1, q - k / 2);
      rlRotatef((shear + 90) / 2, 0, 1, 0);
      rlRotatef(-angle, 0, 0, 1);
      rlScalef(s, s, 1);
      this.preview.updateSettings(
        Object.fromEntries(GAME_SETTINGS_SCHEMA.map((d) => [d.key, config[toGameConfigKey(d.key)] ?? d.defaultValue]))
      );
      this.preview.render(true);
      rlPopMatrix();
    }
    EndScissorMode();
  }
}
