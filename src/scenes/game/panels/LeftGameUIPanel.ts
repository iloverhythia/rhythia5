import {
  Vector2,
  Color,
  rlPushMatrix,
  rlPopMatrix,
  rlTranslatef,
  rlRotatef,
  rlScalef,
  DrawRing,
  GetFrameTime,
} from "raylib";
import { drawText } from "../../../utils/text";
import { drawSprite } from "../../../utils/sprite";
import { lerp } from "../../../utils/lerp";
import { Rhythia } from "../../../atoms/Rhythia";
import { GameUIPanel, GameUIPanelCommonArgs } from "./GameUIPanel";

interface ComboLevel {
  level: number;
  color: Color;
  nextThreshold: number;
}

export interface LeftPanelArgs extends GameUIPanelCommonArgs {
  combo: number;
  hits: number;
  misses: number;
  pauses: number;
  comboScaleAnimation: number;
}

export class LeftGameUIPanel extends GameUIPanel<LeftPanelArgs> {
  private lastMisses = 0;
  private missFlash = 0;

  public render(args: LeftPanelArgs): void {
    rlPushMatrix();

    const uiOpacity = args.settings?.uiOpacity ?? 0.15;
    const playfieldScale = args.settings?.playfieldScale ?? 1.0;
    const uiScale = args.settings?.uiScale ?? 1.0;

    const planeWidth = 150;
    const planeHeight = 350;

    const effectiveBorderHalf = (320 * playfieldScale) / 2;
    const baseMargin =
      Math.min(Rhythia.gameWidth, Rhythia.gameHeight) * 0.2 * playfieldScale;
    const marginScalePush = 1 + (uiScale - 1) * 0.25;
    const normalizedMargin = Math.round(baseMargin * marginScalePush);
    const planeX =
      Rhythia.gameWidth / 2 -
      effectiveBorderHalf -
      (planeWidth / 2) * uiScale -
      normalizedMargin;
    const planeY = Rhythia.gameHeight / 2;

    const depth = args.closeDistance;
    rlTranslatef(planeX, planeY, depth);
    
    this.applyTilt(args);
    rlRotatef(-10, 0, 1, 0);
    
    rlScalef(uiScale, uiScale, 1.0);
    if ((args.settings?.hudLeftBackground ?? 1) > 0) {
      this.drawBackground(planeWidth, planeHeight, uiOpacity);
    }

    const startY = -100;
    const textOpacity = Math.round(255 * (uiOpacity * 5));
    const simple = (args.settings?.simpleHud ?? 0) > 0;

    const comboInfo = this.getComboLevel(args.combo);
    const comboColor = { ...comboInfo.color, a: textOpacity };

    const arcCenterX = 0;
    const arcCenterY = startY + 40;

    if (!simple && (args.settings?.hudCombo ?? 1) > 0) {
      rlPushMatrix();
      rlTranslatef(arcCenterX, arcCenterY, 0);
      rlScalef(args.comboScaleAnimation, args.comboScaleAnimation, 1.0);

      this.drawComboArc(0, 0, args.combo, textOpacity, comboInfo);

      drawText(
        `COMBO`,
        Vector2(0, -70),
        18,
        this.color("panelText", textOpacity * 0.7),
        "center"
      );

      drawText(`${args.combo}x`, Vector2(0, 55), 36, comboColor, "center");

      rlPopMatrix();
    }

    const total = args.hits + args.misses;
    const accuracy = total > 0 ? (args.hits / total) * 100 : 100;
    const accuracyY = arcCenterY + 120;

    if (!simple && (args.settings?.hudAccuracy ?? 1) > 0) {
      drawText(
        `ACCURACY`,
        Vector2(0, accuracyY),
        18,
        this.color("panelText", textOpacity * 0.7),
        "center"
      );
      drawText(
        `${accuracy.toFixed(2)}%`,
        Vector2(0, accuracyY + 20),
        32,
        this.color("panelText", textOpacity),
        "center"
      );
    }

    if (!simple && (args.settings?.hudAccuracyBar ?? 1) > 0) {
      drawSprite("/solid.png", Vector2(-60, accuracyY + 58), Vector2(120, 5), this.color("accEmptyColor", textOpacity));
      drawSprite("/solid.png", Vector2(-60, accuracyY + 58), Vector2((120 * accuracy) / 100, 5), this.color("accFillColor", textOpacity));
    }

    if (args.misses > this.lastMisses) this.missFlash = 1;
    this.lastMisses = args.misses;
    this.missFlash = Math.max(0, this.missFlash - GetFrameTime() * 3);
    const statsY = simple ? -20 : accuracyY + 72;
    const missColor = this.color("missTextColor", textOpacity);
    const flashColor = this.color("missFlashColor", textOpacity);

    if ((args.settings?.hudMisses ?? 1) > 0) {
      drawText(
        `MISSES: ${args.misses}`,
        Vector2(0, statsY),
        20,
        {
          r: lerp(missColor.r, flashColor.r, this.missFlash),
          g: lerp(missColor.g, flashColor.g, this.missFlash),
          b: lerp(missColor.b, flashColor.b, this.missFlash),
          a: lerp(missColor.a, flashColor.a, this.missFlash),
        },
        "center"
      );
    }

    if ((args.settings?.hudPauses ?? 1) > 0) {
      drawText(
        `PAUSES: ${args.pauses}`,
        Vector2(0, statsY + 25),
        20,
        this.color(args.pauses > 0 ? "pauseUsedColor" : "pauseTextColor", textOpacity),
        "center"
      );
    }

    
    args.decorations.forEach((decoration) => {
      decoration.renderLeftOverlay(
        planeX,
        planeY,
        planeWidth,
        planeHeight,
        depth,
        args.decorationContext
      );
    });

    rlPopMatrix();
  }

  private getComboLevel(combo: number): ComboLevel {
    if (combo < 100) {
      return {
        level: 0,
        color: { r: 200, g: 200, b: 200, a: 255 },
        nextThreshold: 100,
      };
    } else if (combo < 200) {
      return {
        level: 1,
        color: { r: 100, g: 180, b: 100, a: 255 },
        nextThreshold: 200,
      };
    } else if (combo < 400) {
      return {
        level: 2,
        color: { r: 180, g: 100, b: 100, a: 255 },
        nextThreshold: 400,
      };
    }

    return {
      level: 3,
      color: { r: 140, g: 100, b: 180, a: 255 },
      nextThreshold: -1,
    };
  }

  private drawComboArc(
    centerX: number,
    centerY: number,
    combo: number,
    textOpacity: number,
    comboInfo: ComboLevel
  ): void {
    const outerRadius = 40;
    const innerRadius = 25;

    if (comboInfo.nextThreshold === -1) {
      DrawRing(
        Vector2(centerX, centerY),
        innerRadius,
        outerRadius,
        0,
        360,
        36,
        this.color("comboFillColor", textOpacity)
      );
      return;
    }

    const currentLevelStart =
      comboInfo.level === 0 ? 0 : comboInfo.level === 1 ? 100 : 200;
    const progress =
      (combo - currentLevelStart) /
      (comboInfo.nextThreshold - currentLevelStart);
    const progressAngle = Math.min(1, Math.max(0, progress)) * 360;

    const startAngle = -90;
    const endAngle = startAngle + progressAngle;

    DrawRing(Vector2(centerX, centerY), innerRadius, outerRadius, 0, 360, 36, this.color("comboEmptyColor", textOpacity));

    if (progressAngle > 0) {
      DrawRing(
        Vector2(centerX, centerY),
        innerRadius,
        outerRadius,
        startAngle,
        endAngle,
        36,
        this.color("comboFillColor", textOpacity)
      );
    }
  }
}
