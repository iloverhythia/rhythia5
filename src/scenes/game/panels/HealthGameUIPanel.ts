import {
  Vector2,
  rlPushMatrix,
  rlPopMatrix,
  rlTranslatef,
  rlScalef,
} from "raylib";
import { drawSprite } from "../../../utils/sprite";
import { Rhythia } from "../../../atoms/Rhythia";
import { clamp } from "../../../utils/lerp";
import { GameUIPanel, GameUIPanelCommonArgs } from "./GameUIPanel";

export interface HealthPanelArgs extends GameUIPanelCommonArgs {
  health: number;
  maxHealth: number;
}

export class HealthGameUIPanel extends GameUIPanel<HealthPanelArgs> {
  public render(args: HealthPanelArgs): void {
    if ((args.settings?.hudHealthBar ?? 1) <= 0) return;
    rlPushMatrix();

    const playfieldScale = args.settings?.playfieldScale ?? 1.0;
    const baseBorderSize = 320 * playfieldScale;
    const barWidth = args.settings?.healthBarWidth ?? 120;
    const barHeight = args.settings?.healthBarHeight ?? 14;
    const uiScale = args.settings?.uiScale ?? 1.0;

    const planeX = Rhythia.gameWidth / 2;
    const baseMargin =
      Math.min(Rhythia.gameWidth, Rhythia.gameHeight) * 0.16 * playfieldScale;
    const marginScalePush = 1 + (uiScale - 1) * 0.25;
    const normalizedMargin = Math.round(baseMargin * marginScalePush);
    const planeY =
      Rhythia.gameHeight / 2 + baseBorderSize / 2 + normalizedMargin;

    const depth = args.closeDistance;
    rlTranslatef(planeX, planeY, depth);

    this.applyTilt(args, (args.settings?.attachHpToGrid ?? 0) > 0);
    rlScalef(uiScale, uiScale, 1.0);

    const barX = -barWidth / 2;
    const barY = 0;

    const backgroundOpacitySetting =
      args.settings?.healthBarOpacity !== undefined
        ? clamp(args.settings.healthBarOpacity, 0, 1)
        : 1;
    drawSprite(
      "/solid.png",
      Vector2(barX, barY),
      Vector2(barWidth, barHeight),
      this.color("energyEmptyColor", 255 * backgroundOpacitySetting)
    );

    const clampedHealth = clamp(args.health, 0, args.maxHealth);
    const fillWidth = (barWidth * clampedHealth) / args.maxHealth;
    if (fillWidth > 0) {
      drawSprite(
        "/solid.png",
        Vector2(barX, barY),
        Vector2(fillWidth, barHeight),
        this.color("energyFillColor", 255 * backgroundOpacitySetting)
      );
    }

    rlPopMatrix();
  }
}
