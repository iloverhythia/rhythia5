import {
  GetCharPressed,
  GetTime,
  IsKeyPressed,
  IsMouseButtonPressed,
  KEY_BACKSPACE,
  KEY_ENTER,
  MOUSE_BUTTON_LEFT,
  MOUSE_BUTTON_RIGHT,
  Vector2,
} from "raylib";
import { openDialog } from "nativefiledialog";
import { PANEL } from "../menu/atoms/BaseDrawer";
import { createPopup } from "../menu/atoms/Popup";
import { drawBorderRect, drawRect } from "../../ui/draw";
import { drawText, measureText } from "../../utils/text";
import { drawSprite } from "../../utils/sprite";
import { inRect } from "../../utils/geometry";
import { playFx } from "../../utils/soundManager";
import { ConfigManager } from "../../utils/configManager";
import { Rhythia } from "../../atoms/Rhythia";
import type { Rect, SettingsRow } from "./pages";

export interface SkinCard {
  id: string;
  name: string;
  draw: (rect: Rect) => void;
}

const FIELD = { r: 30, g: 30, b: 30, a: 255 };
const BUTTON = { r: 28, g: 28, b: 28, a: 255 };
const ACTIVE_TAB = { r: 42, g: 42, b: 42, a: 255 };
const FAVORITE = { r: 255, g: 90, b: 120, a: 255 };
const CARD_HEIGHT = 250;
const GAP = 12;

let focusedField: object | null = null;

const hit = (mouse: Vector2 | null, rect: Rect) =>
  !!mouse && inRect(mouse.x, mouse.y, rect.x, rect.y, rect.w, rect.h);

export function notify(message: string): void {
  const popup = createPopup("info");
  popup.show(message);
  setTimeout(() => {
    popup.hide();
    popup.destroy();
  }, 1200);
}

export async function pickFile(filter: Record<string, string>): Promise<string | null> {
  try {
    return (await openDialog(filter as any)) || null;
  } catch {
    return null;
  }
}

export function drawTextField(
  field: object,
  rect: Rect,
  mouse: Vector2 | null,
  value: string,
  placeholder: string,
  onChange: (value: string) => void,
  center: boolean = false
): void {
  if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
    if (hit(mouse, rect)) focusedField = field;
    else if (focusedField === field) focusedField = null;
  }
  const focused = focusedField === field;
  if (focused) {
    let next = value;
    for (let cp = GetCharPressed(); cp > 0; cp = GetCharPressed()) {
      if (cp >= 32) next += String.fromCodePoint(cp);
    }
    if (IsKeyPressed(KEY_BACKSPACE)) next = next.slice(0, -1);
    if (IsKeyPressed(KEY_ENTER)) focusedField = null;
    if (next !== value) onChange(next);
    value = next;
  }

  drawRect(rect.x, rect.y, rect.w, rect.h, FIELD);
  if (focused) drawBorderRect(rect.x, rect.y, rect.w, rect.h, 1, PANEL.dim);
  const caret = focused && GetTime() % 1 < 0.5 ? "|" : "";
  drawText(
    (value || (focused ? "" : placeholder)) + caret,
    Vector2(center ? rect.x + rect.w / 2 : rect.x + 12, rect.y + (rect.h - 20) / 2),
    20,
    value ? PANEL.text : PANEL.dim,
    center ? "center" : "left"
  );
}

export function textFieldRow(
  label: string,
  get: () => string,
  set: (value: string) => void
): SettingsRow {
  const field = {};
  const fieldRect = (rect: Rect) => ({ x: rect.x, y: rect.y + 40, w: rect.w, h: 44 });
  return {
    kind: "custom",
    height: () => 92,
    draw: (rect, mouse) => {
      drawText(label, Vector2(rect.x, rect.y + 6), 22, PANEL.text);
      drawTextField(field, fieldRect(rect), mouse, get(), label, set, true);
    },
    click: (rect, mouse) => hit(mouse, fieldRect(rect)),
  };
}

function fitText(text: string, width: number, size: number): string {
  let fitted = text;
  while (fitted.length > 1 && measureText(fitted, size).width > width) {
    fitted = fitted.slice(0, -1);
  }
  return fitted;
}

export function skinGridRows(options: {
  favoritesKey: string;
  placeholder: string;
  buttons: { label: string; onClick: () => void }[];
  cards: () => SkinCard[];
  selected: () => string;
  select: (id: string) => void;
}): SettingsRow[] {
  const state = { search: "", favoritesOnly: false };
  const searchField = {};
  const favorites = () => ConfigManager.getExtra<string[]>(options.favoritesKey, []);
  const toggleFavorite = (id: string) => {
    const list = favorites();
    ConfigManager.setExtra(
      options.favoritesKey,
      list.includes(id) ? list.filter((f) => f !== id) : [...list, id]
    );
    playFx("/hover.wav");
  };
  const visible = () => {
    const favs = favorites();
    const term = state.search.trim().toLowerCase();
    return options
      .cards()
      .filter(
        (card) =>
          (!state.favoritesOnly || favs.includes(card.id)) &&
          card.name.toLowerCase().includes(term)
      );
  };

  const buttonRect = (rect: Rect, i: number) => ({
    x: rect.x + rect.w - (options.buttons.length - i) * 126 + 10,
    y: rect.y,
    w: 116,
    h: 42,
  });
  const searchRect = (rect: Rect) => ({ x: rect.x, y: rect.y + 52, w: rect.w, h: 42 });
  const tabRect = (rect: Rect, i: number) => ({
    x: rect.x + i * (rect.w / 2 + 4),
    y: rect.y + 104,
    w: rect.w / 2 - 4,
    h: 38,
  });
  const cardRect = (rect: Rect, i: number) => {
    const w = (rect.w - GAP * 2) / 3;
    return {
      x: rect.x + (i % 3) * (w + GAP),
      y: rect.y + Math.floor(i / 3) * (CARD_HEIGHT + GAP),
      w,
      h: CARD_HEIGHT,
    };
  };
  const heartRect = (card: Rect) => ({ x: card.x + card.w - 34, y: card.y + 10, w: 24, h: 24 });

  const header: SettingsRow = {
    kind: "custom",
    height: () => 142,
    draw: (rect, mouse) => {
      drawText("Search", Vector2(rect.x, rect.y + 10), 22, PANEL.text);
      options.buttons.forEach((button, i) => {
        const r = buttonRect(rect, i);
        drawRect(r.x, r.y, r.w, r.h, hit(mouse, r) ? PANEL.cardHover : BUTTON);
        drawText(button.label, Vector2(r.x + r.w / 2, r.y + 10), 20, PANEL.text, "center");
      });
      drawTextField(searchField, searchRect(rect), mouse, state.search, options.placeholder, (value) => {
        state.search = value;
      });
      const favs = favorites();
      const cards = options.cards();
      [
        `All (${cards.length})`,
        `Favorite (${cards.filter((card) => favs.includes(card.id)).length})`,
      ].forEach((label, i) => {
        const r = tabRect(rect, i);
        const active = state.favoritesOnly === (i === 1);
        drawRect(r.x, r.y, r.w, r.h, active ? ACTIVE_TAB : hit(mouse, r) ? PANEL.cardHover : PANEL.card);
        drawText(label, Vector2(r.x + r.w / 2, r.y + 9), 19, PANEL.text, "center");
      });
    },
    click: (rect, mouse) => {
      const button = options.buttons.find((_, i) => hit(mouse, buttonRect(rect, i)));
      if (button) {
        playFx("/hover.wav");
        button.onClick();
        return true;
      }
      const tab = [0, 1].find((i) => hit(mouse, tabRect(rect, i)));
      if (tab !== undefined) {
        state.favoritesOnly = tab === 1;
        return true;
      }
      return hit(mouse, searchRect(rect));
    },
  };

  const grid: SettingsRow = {
    kind: "custom",
    height: () => Math.ceil(visible().length / 3) * (CARD_HEIGHT + GAP),
    draw: (rect, mouse) => {
      const favs = favorites();
      const selected = options.selected();
      visible().forEach((card, i) => {
        const r = cardRect(rect, i);
        if (r.y > Rhythia.gameHeight || r.y + r.h < PANEL.y + PANEL.headerHeight) return;
        const hovered = hit(mouse, r);
        if (hovered && IsMouseButtonPressed(MOUSE_BUTTON_RIGHT)) toggleFavorite(card.id);
        drawRect(r.x, r.y, r.w, r.h, hovered ? PANEL.cardHover : PANEL.card);
        if (card.id === selected) drawBorderRect(r.x, r.y, r.w, r.h, 2, PANEL.text);
        const size = Math.min(r.w * 0.66, 140);
        card.draw({ x: r.x + (r.w - size) / 2, y: r.y + 105 - size / 2, w: size, h: size });
        drawText(fitText(card.name, r.w - 12, 18), Vector2(r.x + r.w / 2, r.y + r.h - 52), 18, PANEL.text, "center");
        const favorite = favs.includes(card.id);
        if (favorite || hovered) {
          const h = heartRect(r);
          drawSprite("/icons/heart.png", Vector2(h.x, h.y), Vector2(h.w, h.h), favorite ? FAVORITE : PANEL.dim);
        }
      });
    },
    click: (rect, mouse) => {
      const cards = visible();
      const index = cards.findIndex((_, i) => hit(mouse, cardRect(rect, i)));
      if (index < 0) return false;
      if (hit(mouse, heartRect(cardRect(rect, index)))) {
        toggleFavorite(cards[index].id);
      } else {
        options.select(cards[index].id);
        playFx("/hover.wav");
      }
      return true;
    },
  };

  return [header, grid];
}
