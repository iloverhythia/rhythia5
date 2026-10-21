import { Vector2 } from "raylib";
import { GameSettings } from "../../../utils/settingsRegistry";
import {
  UIDecoration,
  UIDecorationContext,
} from "../panel-decorations/UIDecoration";
import { drawSprite } from "../../../utils/sprite";
import { ConfigManager } from "../../../utils/configManager";

export interface GameUIPanelCommonArgs {
  closeDistance: number;
  cameraTiltX: number;
  cameraTiltY: number;
  settings?: Partial<GameSettings>;
  decorations: UIDecoration[];
  decorationContext: UIDecorationContext;
}

export abstract class GameUIPanel<Args extends GameUIPanelCommonArgs> {
  abstract render(args: Args): void;

  protected drawBackground(width: number, height: number, uiOpacity: number): void {
    const color = ConfigManager.getExtra("panelColor", { r: 255, g: 255, b: 255 });
    const tint = ConfigManager.getExtra("panelColorOpacity", 0);
    drawSprite("/solid.png", Vector2(-width / 2, -height / 2), Vector2(width, height), {
      r: Math.round(color.r * tint),
      g: Math.round(color.g * tint),
      b: Math.round(color.b * tint),
      a: Math.round(255 * uiOpacity * 3),
    });
  }
}
