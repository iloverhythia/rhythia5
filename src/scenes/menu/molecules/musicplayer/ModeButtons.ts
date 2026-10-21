import { Vector2, IsMouseButtonReleased, MOUSE_BUTTON_LEFT } from "raylib";
import { drawSprite } from "../../../../utils/sprite";
import { ModeManager, BuiltinModes, Modes } from "../../../game/modes";
import type { GameMode } from "../../../game/modes";
import { drawText, measureText } from "../../../../utils/text";
import { lerpDelta } from "../../../../utils/lerp";
import { drawRect } from "../../../../ui/draw";
import { AccentColor } from "../../../../utils/imageBlur";
import { SpeedContextMenu } from "./SpeedContextMenu";

type ButtonDef = {
  mode: GameMode;
  color: { r: number; g: number; b: number };
  icon?: string;
  label?: string;
  submenu?: "speed";
};

export class ModeButtons {
  private readonly size: number = 64;
  private readonly spacing: number = 10;
  private readonly iconSize: number = 38;
  private hoveredIndex: number = -1;
  private speedMenu: SpeedContextMenu;
  private pendingChange: string | null = null;

  private buttons: ButtonDef[] = [
    { mode: BuiltinModes.Speed125Mode, label: "S", color: { r: 56, g: 189, b: 248 }, submenu: "speed" },
    { mode: BuiltinModes.NoFailMode, label: "NF", color: { r: 74, g: 222, b: 128 } },
    { mode: BuiltinModes.SuddenDeathMode, icon: "/icons/skull.png", color: { r: 248, g: 82, b: 82 } },
    { mode: BuiltinModes.HardrockMode, icon: "/icons/hand-love-you.png", color: { r: 251, g: 146, b: 60 } },
    { mode: BuiltinModes.GhostMode, icon: "/icons/ghost.png", color: { r: 168, g: 85, b: 247 } },
    { mode: BuiltinModes.ChaosMode, icon: "/icons/arrows-shuffle.png", color: { r: 236, g: 72, b: 153 } },
    { mode: BuiltinModes.SpinMode, icon: "/icons/disc.png", color: { r: 59, g: 130, b: 246 } },
    { mode: BuiltinModes.MirrorMode, icon: "/icons/flip-horizontal.png", color: { r: 45, g: 212, b: 191 } },
    { mode: BuiltinModes.AnonymousMode, icon: "/icons/spy.png", color: { r: 250, g: 204, b: 21 } },
  ];
  private rotationAngles: number[] = this.buttons.map(() => 0);

  constructor() {
    this.speedMenu = new SpeedContextMenu({
      items: [
        { id: "speed075", label: "x0.75" },
        { id: "speed080", label: "x0.80" },
        { id: "speed087", label: "x0.87" },
        { id: "default", label: "x1.00 (Default)" },
        { id: "speed115", label: "x1.15" },
        { id: "speed125", label: "x1.25" },
        { id: "speed135", label: "x1.35" },
        { id: "speed145", label: "x1.45" },
        { id: "speedCustom", label: "Custom" },
      ],
      onSelect: (id) => {
        if (id === "default") {
          const current = ModeManager.getActiveModeIds();
          const withoutSpeed = current.filter((mid) => !mid.startsWith("speed"));
          ModeManager.setActiveModesByIds(withoutSpeed);
          this.pendingChange = "default";
        } else {
          const res = ModeManager.toggleModeById(id);
          if (res.ok) {
            this.pendingChange = id;
          }
        }
      },
    });
  }

  public getSize(): number {
    return this.size;
  }

  public update(mousePos: Vector2, centerX: number, y: number): string | null {
    if (this.pendingChange) {
      const c = this.pendingChange;
      this.pendingChange = null;
      return c;
    }

    if (this.speedMenu.isOpenOrAnimating()) {
      return null;
    }

    const startX =
      centerX - (this.buttons.length * (this.size + this.spacing) - this.spacing) / 2;
    this.hoveredIndex = -1;

    for (let i = 0; i < this.buttons.length; i++) {
      const button = this.buttons[i];
      const x = startX + i * (this.size + this.spacing);
      const hovered =
        mousePos.x >= x &&
        mousePos.x <= x + this.size &&
        mousePos.y >= y &&
        mousePos.y <= y + this.size;

      this.rotationAngles[i] = lerpDelta(this.rotationAngles[i], hovered ? 12 : 0, 0.25);

      if (!hovered) continue;
      this.hoveredIndex = i;
      if (!IsMouseButtonReleased(MOUSE_BUTTON_LEFT)) continue;

      if (button.submenu === "speed") {
        this.speedMenu.openAt(x, y, this.size);
        return null;
      }
      return ModeManager.toggleModeById(button.mode.id).ok ? button.mode.id : null;
    }

    return null;
  }

  public isOverlayOpen(): boolean {
    return this.speedMenu?.isOpenOrAnimating() || false;
  }

  public setAccentColor(color: AccentColor | null): void {
    try {
      this.speedMenu.setAccentColor(color);
    } catch {}
  }

  public draw(centerX: number, y: number): void {
    const activeIds = ModeManager.getActiveModeIds();
    const speedId = activeIds.find((id) => id.startsWith("speed"));
    const speedName = speedId ? Modes.getModeById(speedId)?.name : undefined;
    const startX =
      centerX - (this.buttons.length * (this.size + this.spacing) - this.spacing) / 2;

    this.buttons.forEach((button, i) => {
      const x = startX + i * (this.size + this.spacing);
      const centerXBtn = x + this.size / 2;
      const centerYBtn = y + this.size / 2;
      const { r, g, b } = button.color;

      const isHovered = i === this.hoveredIndex;
      const isSelected =
        button.submenu === "speed" ? !!speedId : activeIds.includes(button.mode.id);
      const canEnable =
        isSelected || ModeManager.canEnableWithCurrent(button.mode).ok;

      const tint = isSelected ? 0.3 : isHovered ? 0.2 : 0.12;
      const brightness = isSelected ? 1 : isHovered ? 0.85 : 0.7;
      const color = {
        r: r * brightness,
        g: g * brightness,
        b: b * brightness,
        a: canEnable ? 255 : 90,
      };

      drawRect(x, y, this.size, this.size, { r: 14, g: 14, b: 16, a: 235 });
      drawRect(x, y, this.size, this.size, { r, g, b, a: 255 * tint });

      if (isSelected) {
        drawRect(x, y, this.size, 2, color);
        drawRect(x, y + this.size - 2, this.size, 2, color);
        drawRect(x, y, 2, this.size, color);
        drawRect(x + this.size - 2, y, 2, this.size, color);
      }

      if (button.icon) {
        drawSprite(
          button.icon,
          Vector2(centerXBtn, centerYBtn),
          Vector2(this.iconSize, this.iconSize),
          color,
          undefined,
          false,
          true,
          this.rotationAngles[i],
          Vector2(this.iconSize / 2, this.iconSize / 2)
        );
      } else {
        const label = (button.submenu === "speed" && speedName) || button.label || "";
        const fontSize = label.length > 2 ? 20 : 28;
        const labelSize = measureText(label, fontSize, 1);
        drawText(
          label,
          Vector2(centerXBtn, centerYBtn - labelSize.height / 2),
          fontSize,
          color,
          "center"
        );
      }

      if (isHovered) {
        const tooltip =
          button.submenu === "speed" ? `Speed ${speedName ?? "x1.00"}` : button.mode.name;
        const fontSize = 18;
        const padX = 8;
        const padY = 6;

        const size = measureText(tooltip, fontSize, 1);
        const boxW = size.width + padX * 2;
        const boxH = size.height + padY * 2;
        const boxX = centerXBtn - boxW / 2;
        const boxY = y - boxH - 8;

        drawRect(boxX, boxY, boxW, boxH, { r: 0, g: 0, b: 0, a: 180 });
        drawRect(boxX, boxY + boxH - 2, boxW, 2, { r, g, b, a: 160 });
        drawText(
          tooltip,
          Vector2(centerXBtn, boxY + padY),
          fontSize,
          { r: 255, g: 255, b: 255, a: 255 },
          "center"
        );
      }
    });
  }
}
