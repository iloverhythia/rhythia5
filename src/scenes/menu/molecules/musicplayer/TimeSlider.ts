import {
  Vector2,
  IsMouseButtonDown,
  IsMouseButtonReleased,
  IsMouseButtonPressed,
  MOUSE_BUTTON_LEFT,
} from "raylib";
import { drawSprite } from "../../../../utils/sprite";
import { drawText } from "../../../../utils/text";
import { SoundSpaceMemoryMap } from "../../../../utils/storage/ssmm";
import { tintWithAccent } from "../../../../utils/colors";
import { AccentColor } from "../../../../utils/imageBlur";
import {
  isMusicPlaying,
  pause,
  play,
  seek,
} from "../../../../utils/soundManager";
import { logger } from "../../../../utils/logger";

export class TimeSlider {
  
  private static draggingInstances = 0;
  private static lastSliderBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } | null = null;

  private currentMap: SoundSpaceMemoryMap | null = null;
  private fadeProgress: number = 0;
  private sliderValue: number = 0;
  private isDraggingSlider: boolean = false;
  private sliderHovered: boolean = false;
  private accentColor: AccentColor | null = null;
  private sliderBounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  } = { x: 0, y: 0, width: 0, height: 0 };
  private pauseBounds = { x: 0, y: 0, width: 0, height: 0 };

  public setCurrentMap(map: SoundSpaceMemoryMap | null): void {
    if (map !== this.currentMap) {
      this.currentMap = map;
      this.sliderValue = 0;
      this.isDraggingSlider = false;
      this.sliderHovered = false;
    }
  }

  public setFadeProgress(progress: number): void {
    this.fadeProgress = progress;
  }

  public setAccentColor(color: AccentColor | null): void {
    this.accentColor = color;
  }

  public update(mousePos: Vector2 | null): void {
    if (!mousePos || !this.currentMap) return;

    this.sliderHovered = this.isPointInSlider(mousePos);

    const p = this.pauseBounds;
    if (
      IsMouseButtonReleased(MOUSE_BUTTON_LEFT) &&
      mousePos.x >= p.x &&
      mousePos.x <= p.x + p.width &&
      mousePos.y >= p.y &&
      mousePos.y <= p.y + p.height
    ) {
      if (isMusicPlaying()) pause();
      else play();
    }

    
    if (IsMouseButtonPressed(MOUSE_BUTTON_LEFT)) {
      if (this.isPointInSlider(mousePos)) {
        this.isDraggingSlider = true;
        TimeSlider.draggingInstances++;
        this.updateSliderValue(mousePos);
      }
    }

    if (this.isDraggingSlider) {
      if (IsMouseButtonDown(MOUSE_BUTTON_LEFT)) {
        this.updateSliderValue(mousePos);
      } else {
        this.isDraggingSlider = false;
        if (TimeSlider.draggingInstances > 0) {
          TimeSlider.draggingInstances--;
        }
        const seekTimeMs = this.getStartTimeMs();
        const seekTimeSeconds = seekTimeMs / 1000;
        seek(seekTimeSeconds);
        logger(`Seeking to ${seekTimeSeconds.toFixed(1)}s`);
      }
    }
  }

  public draw(centerX: number, y: number): void {
    if (!this.currentMap) return;

    const sliderWidth = 250;
    const sliderHeight = 6;
    const knobSize = 20;
    const iconSize = 26;
    const timeWidth = 56;
    const totalWidth = iconSize + timeWidth + sliderWidth + timeWidth + 36;
    const alpha = this.fadeProgress * 255;
    const textColor = { r: 230, g: 230, b: 230, a: alpha };
    const format = (ms: number) =>
      [Math.floor(ms / 60000), Math.floor((ms % 60000) / 1000)]
        .map((n) => String(n).padStart(2, "0"))
        .join(":");

    const startX = centerX - totalWidth / 2;
    this.pauseBounds = {
      x: startX,
      y: y - iconSize / 2,
      width: iconSize,
      height: iconSize,
    };
    drawSprite(
      isMusicPlaying() ? "/icons/player-pause.png" : "/icons/player-play.png",
      Vector2(startX, y - iconSize / 2),
      Vector2(iconSize, iconSize),
      textColor
    );

    const durationMs = this.currentMap.duration || 0;
    drawText(
      format(durationMs * this.sliderValue),
      Vector2(startX + iconSize + 12, y - 10),
      20,
      textColor,
      "left"
    );

    const sliderX = startX + iconSize + timeWidth + 18;
    const sliderY = y;
    drawSprite(
      "/solid.png",
      Vector2(sliderX, sliderY - sliderHeight / 2),
      Vector2(sliderWidth, sliderHeight),
      { r: 60, g: 60, b: 60, a: alpha }
    );

    const filledWidth = sliderWidth * this.sliderValue;
    if (filledWidth > 0) {
      const fillColor = tintWithAccent(
        { r: 220, g: 220, b: 220 },
        this.accentColor,
        0.5
      );
      drawSprite(
        "/solid.png",
        Vector2(sliderX, sliderY - sliderHeight / 2),
        Vector2(filledWidth, sliderHeight),
        { ...fillColor, a: alpha }
      );
    }

    const knobX = sliderX + sliderWidth * this.sliderValue;
    drawSprite(
      "/circle.png",
      Vector2(knobX - knobSize / 2, sliderY - knobSize / 2),
      Vector2(knobSize, knobSize),
      this.sliderHovered || this.isDraggingSlider
        ? { r: 255, g: 255, b: 255, a: alpha }
        : { r: 225, g: 225, b: 225, a: alpha }
    );

    drawText(
      format(durationMs),
      Vector2(sliderX + sliderWidth + 18, y - 10),
      20,
      textColor,
      "left"
    );

    this.sliderBounds = {
      x: sliderX - knobSize / 2,
      y: sliderY - knobSize / 2,
      width: sliderWidth + knobSize,
      height: knobSize,
    };

    
    TimeSlider.lastSliderBounds = { ...this.sliderBounds };
  }

  private isPointInSlider(mousePos: Vector2): boolean {
    return (
      mousePos.x >= this.sliderBounds.x &&
      mousePos.x <= this.sliderBounds.x + this.sliderBounds.width &&
      mousePos.y >= this.sliderBounds.y &&
      mousePos.y <= this.sliderBounds.y + this.sliderBounds.height
    );
  }

  private updateSliderValue(mousePos: Vector2): void {
    const relativeX = mousePos.x - this.sliderBounds.x;
    const normalizedValue = Math.max(
      0,
      Math.min(1, relativeX / this.sliderBounds.width)
    );
    this.sliderValue = normalizedValue;
  }

  public getStartTimeMs(): number {
    if (!this.currentMap) return 0;
    return Math.floor((this.currentMap.duration || 0) * this.sliderValue);
  }

  
  public static isAnyDragging(): boolean {
    return TimeSlider.draggingInstances > 0;
  }

  public static isMouseOverAny(boundsCheckPos: {
    x: number;
    y: number;
  }): boolean {
    const b = TimeSlider.lastSliderBounds;
    if (!b) return false;
    const x = boundsCheckPos.x;
    const y = boundsCheckPos.y;
    return x >= b.x && x <= b.x + b.width && y >= b.y && y <= b.y + b.height;
  }
}
