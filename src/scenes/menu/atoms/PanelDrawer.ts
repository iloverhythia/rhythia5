import { Vector2, BeginScissorMode, EndScissorMode } from "raylib";
import { ScrollableDrawer } from "./ScrollableDrawer";
import { PANEL } from "./BaseDrawer";
import { drawSprite } from "../../../utils/sprite";
import { drawText, measureText } from "../../../utils/text";
import { drawRect, drawBorderRect } from "../../../ui/draw";
import { inRect } from "../../../utils/geometry";
import { playFx } from "../../../utils/soundManager";
import { Rhythia } from "../../../atoms/Rhythia";
import { getPresentationInfo } from "../../../atoms/sysutils/rendering";
import type { Rect } from "../../settings/pages";

export type Hit = { rect: Rect; press: (mouse: Vector2) => void };
type Option = { id: string; label: string };
type Dropdown = {
  anchor: Rect;
  options: Option[];
  selected: string;
  columns: number;
  onSelect: (id: string) => void;
};

export const hovered = (rect: Rect, mouse: Vector2 | null) =>
  !!mouse && inRect(mouse.x, mouse.y, rect.x, rect.y, rect.w, rect.h);

export function drawCard(rect: Rect, hover: boolean = false): void {
  drawRect(rect.x, rect.y, rect.w, rect.h, hover ? PANEL.cardHover : PANEL.card);
  drawBorderRect(rect.x, rect.y, rect.w, rect.h, 2, PANEL.border);
}

export function drawField(rect: Rect, text: string, hover: boolean = false): void {
  const shade = hover ? 38 : 30;
  drawRect(rect.x, rect.y, rect.w, rect.h, { r: shade, g: shade, b: shade + 2, a: 255 });
  drawText(text, Vector2(rect.x + 12, rect.y + (rect.h - 20) / 2), 20, PANEL.text);
}

export function drawToggle(x: number, y: number, on: boolean, label: string = ""): Rect {
  const w = 66;
  const h = 32;
  const pill = (inset: number, color: { r: number; g: number; b: number; a: number }) => {
    const size = h - inset * 2;
    drawSprite("/circle.png", Vector2(x + inset, y + inset), Vector2(size, size), color);
    drawSprite("/circle.png", Vector2(x + w - inset - size, y + inset), Vector2(size, size), color);
    drawRect(x + h / 2, y + inset, w - h, size, color);
  };
  pill(0, on ? { r: 120, g: 120, b: 124, a: 255 } : { r: 70, g: 70, b: 74, a: 255 });
  pill(2, on ? { r: 88, g: 88, b: 92, a: 255 } : { r: 16, g: 16, b: 18, a: 255 });
  drawSprite("/circle.png", Vector2(on ? x + w - h + 5 : x + 5, y + 5), Vector2(h - 10, h - 10), PANEL.text);
  if (label) drawText(label, Vector2(x + w + 11, y + 6), 20, PANEL.text);
  return { x, y, w: label ? w + 11 + measureText(label, 20).width : w, h };
}

export function drawTabs(rect: Rect, tabs: Option[], active: string, mouse: Vector2 | null, hits: Hit[], onSelect: (id: string) => void): void {
  const w = (rect.w - 12 * (tabs.length - 1)) / tabs.length;
  tabs.forEach((tab, index) => {
    const tabRect = { x: rect.x + index * (w + 12), y: rect.y, w, h: rect.h };
    const shade = tab.id === active ? 44 : hovered(tabRect, mouse) ? 32 : 24;
    drawRect(tabRect.x, tabRect.y, w, rect.h, { r: shade, g: shade, b: shade + 2, a: 255 });
    drawText(tab.label, Vector2(tabRect.x + w / 2, rect.y + (rect.h - 20) / 2), 20, tab.id === active ? PANEL.text : PANEL.dim, "center");
    hits.push({ rect: tabRect, press: () => onSelect(tab.id) });
  });
}

export abstract class PanelDrawer extends ScrollableDrawer {
  protected hits: Hit[] = [];
  protected dropdown: Dropdown | null = null;

  protected abstract drawBody(column: Rect, mouse: Vector2 | null, hits: Hit[]): number;

  protected getScrollAreaTop(): number {
    return this.getContentRect().y + 2;
  }

  protected getScrollAreaBottomPadding(): number {
    return PANEL.bottom + 2;
  }

  protected getScrollTrackX(): number {
    return this.getPanelRight() - 14;
  }

  protected isScrollInteractionSuspended(): boolean {
    return !!this.dropdown;
  }

  protected scrollArea(): Rect {
    const content = this.getContentRect();
    return { x: content.x, y: this.getScrollAreaTop(), w: content.w, h: this.getScrollAreaHeight() };
  }

  protected isVisible(rect: Rect): boolean {
    const area = this.scrollArea();
    return rect.y < area.y + area.h && rect.y + rect.h > area.y;
  }

  protected openDropdown(anchor: Rect, options: Option[], selected: string, onSelect: (id: string) => void, columns: number = 1): void {
    this.dropdown = { anchor, options, selected, onSelect, columns };
  }

  protected onUpdate(): void {
    this.updateScroll(this.gameObject.getMousePosition());
  }

  protected onDrawerClick(mouse: Vector2 | null): boolean {
    if (!mouse) return true;
    const fromDropdown = !!this.dropdown;
    this.dropdown = null;
    if (!fromDropdown && !hovered(this.scrollArea(), mouse)) return true;
    const hit = this.hits.find((h) => hovered(h.rect, mouse));
    if (hit) {
      hit.press(mouse);
      playFx("/click.wav", 0.3);
    }
    return true;
  }

  protected drawContent(): void {
    const area = this.scrollArea();
    const mouse = this.gameObject.getMousePosition();
    const hits: Hit[] = [];
    const column = { x: area.x + 17, y: area.y + 18 - this.scrollOffset, w: area.w - 34, h: 0 };
    const { viewport } = getPresentationInfo();
    const scaleX = viewport.width / Rhythia.gameWidth;
    const scaleY = viewport.height / Rhythia.gameHeight;
    BeginScissorMode(
      Math.round(viewport.x + (area.x + (this.gameObject.rectArea?.pos.x ?? 0)) * scaleX),
      Math.round(viewport.y + area.y * scaleY),
      Math.round(area.w * scaleX),
      Math.round(area.h * scaleY)
    );
    const bottom = this.drawBody(column, this.dropdown || !hovered(area, mouse) ? null : mouse, hits);
    EndScissorMode();
    this.maxScrollOffset = Math.max(0, bottom + this.scrollOffset + 18 - area.y - area.h);
    this.hits = this.dropdown ? this.drawDropdown(this.dropdown, mouse, area) : hits;
    this.renderScrollbar();
  }

  private drawDropdown({ anchor, options, selected, columns, onSelect }: Dropdown, mouse: Vector2 | null, area: Rect): Hit[] {
    const itemW = anchor.w / columns;
    const listH = Math.ceil(options.length / columns) * 34;
    const top =
      anchor.y + anchor.h + listH > area.y + area.h
        ? Math.max(area.y, anchor.y - listH)
        : anchor.y + anchor.h;
    drawRect(anchor.x, top, anchor.w, listH, { r: 26, g: 26, b: 28, a: 255 });
    drawBorderRect(anchor.x, top, anchor.w, listH, 2, PANEL.border);
    return options.map((option, index) => {
      const item = { x: anchor.x + (index % columns) * itemW, y: top + Math.floor(index / columns) * 34, w: itemW, h: 34 };
      if (hovered(item, mouse)) drawRect(item.x + 2, item.y, item.w - 4, item.h, PANEL.cardHover);
      drawText(option.label, Vector2(item.x + 12, item.y + 7), 20, option.id === selected ? PANEL.text : PANEL.dim);
      return { rect: item, press: () => onSelect(option.id) };
    });
  }
}
