import {
  Vector2,
  rlPushMatrix,
  rlPopMatrix,
  rlTranslatef,
  rlScalef,
} from "raylib";
import { drawSprite } from "../../../utils/sprite";
import { drawText } from "../../../utils/text";
import { Rhythia } from "../../../atoms/Rhythia";
import { SoundSpaceMemoryMap } from "../../../utils/storage/ssmm";
import { GameUIPanel, GameUIPanelCommonArgs } from "./GameUIPanel";
import { ConfigManager } from "../../../utils/configManager";

export interface TopPanelArgs extends GameUIPanelCommonArgs {
  mapData: SoundSpaceMemoryMap | null;
  currentTime: number;
  canSkip: boolean;
}

export class TopGameUIPanel extends GameUIPanel<TopPanelArgs> {
  public render(args: TopPanelArgs): void {
    rlPushMatrix();

    const uiOpacity = args.settings?.uiOpacity ?? 0.15;
    const playfieldScale = args.settings?.playfieldScale ?? 1.0;
    const uiScale = args.settings?.uiScale ?? 1.0;

    const planeX = Rhythia.gameWidth / 2;
    const effectiveBorderHalf = (340 * playfieldScale) / 2;
    const baseMargin = Math.min(Rhythia.gameWidth, Rhythia.gameHeight) * 0.2 * playfieldScale;
    const marginScalePush = 1 + (uiScale - 1) * 0.25;
    const normalizedMargin = Math.round(baseMargin * marginScalePush);
    const planeY =
      Rhythia.gameHeight / 2 - effectiveBorderHalf - normalizedMargin;

    const depth = args.closeDistance;
    rlTranslatef(planeX, planeY, depth);

    this.applyTilt(args, (args.settings?.attachTimerToGrid ?? 0) > 0);
    rlScalef(uiScale, uiScale, 1.0);

    const textOpacity = Math.round(255 * (uiOpacity * 5));
    const lastNote = args.mapData?.notes?.[args.mapData.notes.length - 1]?.[0] ?? Infinity;
    const state = args.canSkip ? "Canskip" : args.currentTime > lastNote ? "Done" : "";

    const mapName = args.mapData?.title || "Unknown Map";
    if (
      (args.settings?.hudMapTitle ?? 1) > 0 &&
      !ConfigManager.getExtra("streamer.hideMapTitles", false)
    ) {
      drawText(
        mapName,
        Vector2(0, -35),
        28,
        this.color(`timerText${state}` as const, textOpacity),
        "center"
      );
    }

    const timeInSeconds = Math.max(0, args.currentTime / 1000);
    const minutes = Math.floor(timeInSeconds / 60);
    const seconds = Math.floor(timeInSeconds % 60);
    const currentTimeString = `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;

    let durationString = "";
    if (args.mapData?.duration) {
      const durationInSeconds = args.mapData.duration / 1000;
      const durationMinutes = Math.floor(durationInSeconds / 60);
      const durationSeconds = Math.floor(durationInSeconds % 60);
      durationString = `${durationMinutes
        .toString()
        .padStart(2, "0")}:${durationSeconds.toString().padStart(2, "0")}`;
    }

    const timeDisplay = durationString
      ? `${currentTimeString} / ${durationString}`
      : currentTimeString;
    if ((args.settings?.hudTime ?? 1) > 0) {
      drawText(
        timeDisplay,
        Vector2(0, -10),
        22,
        this.color(`timerText${state}` as const, textOpacity * 0.8),
        "center"
      );
    }

    if (args.mapData?.duration && (args.settings?.hudProgressBar ?? 1) > 0) {
      this.render3DProgressBar(
        0,
        20,
        args.currentTime,
        args.mapData.duration,
        textOpacity,
        state
      );
    }

    rlPopMatrix();
  }

  private render3DProgressBar(
    centerX: number,
    y: number,
    currentTime: number,
    duration: number,
    textOpacity: number,
    state: "" | "Done" | "Canskip"
  ): void {
    const barWidth = 300;
    const barHeight = 12;

    const progress = Math.min(1, Math.max(0, currentTime / duration));
    const fillWidth = barWidth * progress;

    drawSprite(
      "/solid.png",
      Vector2(centerX - barWidth / 2, y - barHeight / 2),
      Vector2(barWidth, barHeight),
      this.color(`timerBg${state}` as const, textOpacity)
    );

    if (fillWidth > 0) {
      drawSprite(
        "/solid.png",
        Vector2(centerX - barWidth / 2, y - barHeight / 2),
        Vector2(fillWidth, barHeight),
        this.color(`timerFg${state}` as const, textOpacity)
      );
    }
  }
}
