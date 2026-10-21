import { Vector2, IsMouseButtonDown, MOUSE_BUTTON_LEFT } from "raylib";
import { PANEL } from "../atoms/BaseDrawer";
import {
  PanelDrawer,
  Hit,
  hovered,
  drawCard,
  drawField,
  drawToggle,
} from "../atoms/PanelDrawer";
import { ConfigManager } from "../../../utils/configManager";
import { drawSprite } from "../../../utils/sprite";
import { drawText, measureText } from "../../../utils/text";
import { drawRect } from "../../../ui/draw";
import { clamp } from "../../../utils/lerp";
import { BeatmapData } from "../../../utils/types";
import { getPlayedMapIds } from "../../../utils/storage/localScores";
import type { Rect, SettingsRow } from "../../settings/pages";

export const STAR_LIMIT = 15;
export const LENGTH_LIMIT = 1200;

const DEFAULT_FILTERS = {
  sortBy: "stars",
  ascending: false,
  groupBy: "none",
  ranked: true,
  unranked: true,
  approved: true,
  explicit: true,
  onlyPlayed: false,
  minStars: 0,
  maxStars: STAR_LIMIT,
  minLength: 0,
  maxLength: LENGTH_LIMIT,
};

export type MapFilters = typeof DEFAULT_FILTERS;
type Key = (map: BeatmapData) => number | string;
type Row = Extract<SettingsRow, { kind: "button" | "select" | "toggle" | "slider" }>;

const statusOf = (map: BeatmapData) => {
  const status = (map.status || "").toUpperCase();
  return status === "RANKED" ? "ranked" : status === "APPROVED" ? "approved" : "unranked";
};

const SORTS: Record<string, { label: string; key: Key }> = {
  stars: { label: "Stars", key: (map) => map.starRating || 0 },
  length: { label: "Length", key: (map) => map.length || 0 },
  title: { label: "Title", key: (map) => (map.title || "").toLowerCase() },
  mapper: { label: "Mapper", key: (map) => (map.ownerUsername || "").toLowerCase() },
  difficulty: { label: "Difficulty", key: (map) => map.difficulty || 0 },
  date: { label: "Date added", key: (map) => map.created_at || "" },
};

const GROUPS: Record<string, { label: string; key: Key }> = {
  none: { label: "None", key: () => 0 },
  status: { label: "Status", key: statusOf },
  mapper: SORTS.mapper,
  stars: { label: "Stars", key: (map) => Math.floor(map.starRating || 0) },
  difficulty: SORTS.difficulty,
};

const compare = (a: number | string, b: number | string) => (a < b ? -1 : a > b ? 1 : 0);

const clock = (seconds: number) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(Math.round(seconds % 60)).padStart(2, "0")}`;

export class DrawerFilters extends PanelDrawer {
  private filters: MapFilters = {
    ...DEFAULT_FILTERS,
    ...ConfigManager.getExtra<Partial<MapFilters>>("mapFilters", {}),
  };
  private sortingEnabled: boolean = true;
  private drag: { row: Extract<SettingsRow, { kind: "slider" }>; x0: number; x1: number; value: number } | null = null;

  onChange = () => {};

  protected getHeaderText(): string {
    return "Sort & Filter";
  }

  protected getSubtitleText(): string {
    return "Adjust how maps are sorted and grouped";
  }

  private setFilters(changes: Partial<MapFilters>): void {
    this.filters = { ...this.filters, ...changes };
    ConfigManager.setExtra("mapFilters", this.filters);
    this.onChange();
  }

  private rows(): Row[] {
    const select = (label: string, key: "sortBy" | "groupBy", table: typeof SORTS): Row => ({
      kind: "select",
      label,
      options: () => Object.entries(table).map(([id, option]) => ({ id, label: option.label })),
      get: () => this.filters[key],
      set: (id) => this.setFilters({ [key]: id }),
    });
    const toggle = (
      label: string,
      key: "ascending" | "ranked" | "unranked" | "approved" | "explicit" | "onlyPlayed",
      onLabel: string = "Show",
      offLabel: string = onLabel
    ): Row => ({
      kind: "toggle",
      label,
      onLabel,
      offLabel,
      get: () => this.filters[key],
      set: (value) => this.setFilters({ [key]: value }),
    });
    const slider = (
      label: string,
      key: "minStars" | "maxStars" | "minLength" | "maxLength",
      max: number,
      step: number,
      format: (value: number) => string,
      maxLabel?: string
    ): Row => ({
      kind: "slider",
      label,
      min: 0,
      max,
      step,
      format,
      maxLabel,
      get: () => this.filters[key],
      set: (value) => this.setFilters({ [key]: value }),
    });
    const stars = (value: number) => String(Math.round(value * 10) / 10);

    return [
      { kind: "button", label: "Reset filters", onClick: () => this.setFilters(DEFAULT_FILTERS) },
      ...(this.sortingEnabled
        ? [
            select("Sort by", "sortBy", SORTS),
            toggle("Sort order", "ascending", "Ascending", "Descending"),
            select("Group by", "groupBy", GROUPS),
          ]
        : []),
      toggle("Ranked", "ranked"),
      toggle("Unranked", "unranked"),
      toggle("Approved", "approved"),
      toggle("Explicit", "explicit"),
      toggle("Played maps", "onlyPlayed", "Only played"),
      slider("Min stars", "minStars", STAR_LIMIT, 0.1, stars),
      slider("Max stars", "maxStars", STAR_LIMIT, 0.1, stars, "∞"),
      slider("Min length", "minLength", LENGTH_LIMIT, 5, clock),
      slider("Max length", "maxLength", LENGTH_LIMIT, 5, clock, "∞"),
    ];
  }

  protected onUpdate(): void {
    const mouse = this.gameObject.getMousePosition();
    if (this.drag && mouse) {
      const { row, x0, x1 } = this.drag;
      const ratio = clamp((mouse.x - x0) / (x1 - x0), 0, 1);
      this.drag.value = Math.round((row.min + ratio * (row.max - row.min)) / row.step) * row.step;
      if (!IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
        row.set(this.drag.value);
        this.drag = null;
      }
    }
    super.onUpdate();
  }

  protected isScrollInteractionSuspended(): boolean {
    return super.isScrollInteractionSuspended() || !!this.drag;
  }

  protected drawBody(column: Rect, mouse: Vector2 | null, hits: Hit[]): number {
    let y = column.y;
    for (const row of this.rows()) {
      const card = { x: column.x, y, w: column.w, h: row.kind === "button" ? 44 : 100 };
      y += card.h + 10;
      if (!this.isVisible(card)) continue;

      if (row.kind === "button") {
        drawCard(card, hovered(card, mouse));
        drawText(row.label, Vector2(card.x + card.w / 2, card.y + 12), 20, PANEL.text, "center");
        hits.push({ rect: card, press: row.onClick });
        continue;
      }

      drawCard(card);
      drawText(row.label, Vector2(card.x + 15, card.y + 16), 22, PANEL.text);

      if (row.kind === "select") {
        const field = { x: card.x + 14, y: card.y + 46, w: card.w - 28, h: 38 };
        const options = row.options();
        drawField(field, options.find((option) => option.id === row.get())?.label ?? "", hovered(field, mouse));
        hits.push({ rect: field, press: () => this.openDropdown(field, options, row.get(), row.set) });
      } else if (row.kind === "toggle") {
        const on = row.get();
        const rect = drawToggle(card.x + 14, card.y + 52, on, (on ? row.onLabel : row.offLabel) ?? "");
        hits.push({ rect, press: () => row.set(!on) });
      } else if (row.kind === "slider") {
        const value = this.drag?.row.label === row.label ? this.drag.value : row.get();
        const format = row.format ?? String;
        const minLabel = format(row.min);
        const maxLabel = row.maxLabel ?? format(row.max);
        const infinite = maxLabel === "∞";
        const lineY = card.y + 62;
        const x0 = card.x + 32 + measureText(minLabel, 18).width;
        const x1 = card.x + card.w - 30 - (infinite ? 18 : measureText(maxLabel, 18).width);
        const knobX = x0 + ((value - row.min) / (row.max - row.min)) * (x1 - x0);
        drawText(row.maxLabel && value >= row.max ? "No limit" : format(value), Vector2(card.x + card.w - 15, card.y + 18), 20, PANEL.dim, "right");
        drawText(minLabel, Vector2(card.x + 18, lineY - 9), 18, PANEL.text);
        if (infinite) {
          drawSprite("/icons/infinity.png", Vector2(card.x + card.w - 34, lineY - 9), Vector2(18, 18), PANEL.text);
        } else {
          drawText(maxLabel, Vector2(card.x + card.w - 16, lineY - 9), 18, PANEL.text, "right");
        }
        drawRect(x0, lineY - 2, x1 - x0, 4, { r: 60, g: 60, b: 64, a: 255 });
        drawRect(x0, lineY - 2, knobX - x0, 4, PANEL.text);
        drawSprite("/circle.png", Vector2(knobX - 11, lineY - 11), Vector2(22, 22), PANEL.text);
        hits.push({
          rect: { x: x0 - 12, y: lineY - 16, w: x1 - x0 + 24, h: 32 },
          press: () => (this.drag = { row, x0, x1, value }),
        });
      }
    }
    return y - 10;
  }

  public apply(maps: BeatmapData[]): BeatmapData[] {
    const f = this.filters;
    const played = f.onlyPlayed ? getPlayedMapIds() : null;
    const sort = SORTS[f.sortBy] ?? SORTS.stars;
    const group = GROUPS[f.groupBy] ?? GROUPS.none;
    const direction = f.ascending ? 1 : -1;
    return maps
      .filter((map) => {
        const stars = map.starRating || 0;
        const length = map.length || 0;
        return (
          f[statusOf(map)] &&
          (f.explicit || !/explicit/i.test(map.tags || "")) &&
          (!played || played.has(String(map.id))) &&
          stars >= f.minStars &&
          (f.maxStars >= STAR_LIMIT || stars <= f.maxStars) &&
          length >= f.minLength &&
          (f.maxLength >= LENGTH_LIMIT || length <= f.maxLength)
        );
      })
      .sort(
        (a, b) =>
          direction * (compare(group.key(a), group.key(b)) || compare(sort.key(a), sort.key(b)))
      );
  }

  public apiParams(): { minStars?: number; maxStars?: number; minLength?: number; maxLength?: number; status?: string } {
    const f = this.filters;
    const statuses = (["ranked", "approved", "unranked"] as const).filter((status) => f[status]);
    return {
      minStars: f.minStars > 0 ? f.minStars : undefined,
      maxStars: f.maxStars < STAR_LIMIT ? f.maxStars : undefined,
      minLength: f.minLength > 0 ? f.minLength * 1000 : undefined,
      maxLength: f.maxLength < LENGTH_LIMIT ? f.maxLength * 1000 : undefined,
      status: statuses.length === 1 ? statuses[0].toUpperCase() : undefined,
    };
  }

  public setSortingEnabled(enabled: boolean): void {
    this.sortingEnabled = enabled;
  }
}

export function createDrawerFilters(): DrawerFilters {
  return new DrawerFilters();
}
