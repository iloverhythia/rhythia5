import * as path from "path";
import { Color, Vector2 } from "raylib";
import { ConfigManager } from "../../utils/configManager";
import { drawSprite } from "../../utils/sprite";
import { drawBorderRect, drawRect } from "../../ui/draw";
import { listSkinFiles } from "./noteRenderers/noteSkins";

export interface BorderSkin {
  id: string;
  name: string;
  draw: (x: number, y: number, size: number, color: Color) => void;
}

const builtinBorders: BorderSkin[] = [
  {
    id: "default",
    name: "default",
    draw: (x, y, size, color) =>
      drawSprite("/border.png", Vector2(x, y), Vector2(size, size), color),
  },
  {
    id: "thin",
    name: "thin",
    draw: (x, y, size, color) => drawBorderRect(x, y, size, size, 2, color),
  },
  {
    id: "thick",
    name: "thick",
    draw: (x, y, size, color) => drawBorderRect(x, y, size, size, 8, color),
  },
  {
    id: "corners",
    name: "corners",
    draw: (x, y, size, color) => {
      const length = size * 0.22;
      const end = size - length;
      [[0, 0], [end, 0], [0, size - 4], [end, size - 4]].forEach(([dx, dy]) =>
        drawRect(x + dx, y + dy, length, 4, color)
      );
      [[0, 0], [size - 4, 0], [0, end], [size - 4, end]].forEach(([dx, dy]) =>
        drawRect(x + dx, y + dy, 4, length, color)
      );
    },
  },
  {
    id: "glow",
    name: "glow",
    draw: (x, y, size, color) => {
      for (let i = 6; i >= 1; i--) {
        drawBorderRect(x - i * 3, y - i * 3, size + i * 6, size + i * 6, 3, {
          ...color,
          a: Math.round(color.a * (1 - i / 7) * 0.4),
        });
      }
      drawBorderRect(x, y, size, size, 3, color);
    },
  },
];

export function borderSkins(): BorderSkin[] {
  return [
    ...builtinBorders,
    ...listSkinFiles("borderskins").map((file) => ({
      id: file,
      name: path.basename(file, path.extname(file)),
      draw: (x: number, y: number, size: number, color: Color) =>
        drawSprite(
          file,
          Vector2(x, y),
          Vector2(size, size),
          { r: 255, g: 255, b: 255, a: color.a },
          undefined,
          true
        ),
    })),
  ];
}

export function selectedBorderSkin(): BorderSkin {
  const id = ConfigManager.getExtra("borderSkin", "default");
  return borderSkins().find((skin) => skin.id === id) ?? builtinBorders[0];
}
