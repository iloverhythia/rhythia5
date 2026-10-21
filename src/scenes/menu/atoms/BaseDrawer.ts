import { Vector2, rlPushMatrix, rlPopMatrix, rlTranslatef } from "raylib";
import { GameObject } from "../../../atoms/Object";
import { drawSprite } from "../../../utils/sprite";
import { drawText, measureText } from "../../../utils/text";
import { Rhythia } from "../../../atoms/Rhythia";
import { lerpDelta } from "../../../utils/lerp";
import { playFx } from "../../../utils/soundManager";
import { AccentColor } from "../../../utils/imageBlur";
import { drawRect, drawBorderRect, drawOverlay } from "../../../ui/draw";
import { inRect } from "../../../utils/geometry";

export const PANEL = {
  x: 85,
  y: 30,
  width: 655,
  headerHeight: 80,
  gap: 14,
  bottom: 30,
  padding: 18,
  background: { r: 14, g: 14, b: 15, a: 250 },
  card: { r: 22, g: 22, b: 24, a: 255 },
  cardHover: { r: 30, g: 30, b: 33, a: 255 },
  border: { r: 44, g: 44, b: 48, a: 255 },
  text: { r: 240, g: 240, b: 240, a: 255 },
  dim: { r: 160, g: 160, b: 165, a: 255 },
};

export abstract class BaseDrawer {
  protected gameObject: GameObject;
  protected overlayObject: GameObject;
  protected isOpen: boolean = false;
  protected animationProgress: number = 0;
  protected readonly drawerWidth: number;
  protected readonly drawerHeight: number = Rhythia.gameHeight;
  protected accentColor: AccentColor | null = null;
  protected overlayOpacity: number = 0.6;
  protected backgroundOpacity: number = 1.0;

  constructor(drawerWidth: number = PANEL.x + PANEL.width) {
    this.drawerWidth = drawerWidth;
    this.gameObject = new GameObject({ zBase: 10 });
    this.overlayObject = new GameObject({ zBase: 9 });
    this.initialize();
  }

  private initialize(): void {
    this.gameObject.attachRect({
      pos: { x: 0, y: 0 },
      size: { x: this.drawerWidth, y: this.drawerHeight },
    });

    this.overlayObject.attachRect({
      pos: { x: 0, y: 0 },
      size: { x: Rhythia.gameWidth, y: Rhythia.gameHeight },
    });

    this.gameObject.onDraw = () => this.draw();
    this.overlayObject.onDraw = () => this.drawOverlay();
    this.gameObject.onUpdate = () => this.update();

    this.overlayObject.rectArea!.onClick = () => {
      if (!this.isOpen || this.animationProgress <= 0.5) return false;
      if (this.onOverlayClick()) {
        this.close();
        playFx("/hover.wav");
      }
      return true;
    };

    this.gameObject.rectArea!.onClick = () => {
      if (!this.isOpen || this.animationProgress <= 0.5) return false;
      const mousePos = this.gameObject.getMousePosition();
      const close = this.getCloseButtonRect();
      const back = this.getBackButtonRect();
      if (mousePos && this.shouldShowCloseButton() && inRect(mousePos.x, mousePos.y, close.x, close.y, close.w, close.h)) {
        this.close();
        playFx("/hover.wav");
        return true;
      }
      if (mousePos && this.canGoBack() && inRect(mousePos.x, mousePos.y, back.x, back.y, back.w, back.h)) {
        this.onBack();
        playFx("/hover.wav");
        return true;
      }
      if (mousePos && mousePos.x > this.getPanelRight()) return false;
      return this.onDrawerClick(mousePos);
    };
  }

  protected abstract drawContent(): void;

  protected abstract getHeaderText(): string;

  protected getSubtitleText(): string {
    return "";
  }

  protected canGoBack(): boolean {
    return false;
  }

  protected onBack(): void {}

  protected getPanelRight(): number {
    return Math.min(this.drawerWidth, PANEL.x + PANEL.width);
  }

  protected getContentRect(): { x: number; y: number; w: number; h: number } {
    const y = PANEL.y + PANEL.headerHeight + PANEL.gap;
    return {
      x: PANEL.x,
      y,
      w: this.getPanelRight() - PANEL.x,
      h: this.drawerHeight - PANEL.bottom - y,
    };
  }

  protected getCloseButtonRect(): { x: number; y: number; w: number; h: number } {
    return { x: this.getPanelRight() - 54, y: PANEL.y + 22, w: 36, h: 36 };
  }

  protected getBackButtonRect(): { x: number; y: number; w: number; h: number } {
    return { x: this.getPanelRight() - 98, y: PANEL.y + 22, w: 36, h: 36 };
  }

  protected onDrawerClick(mousePos: Vector2 | null): boolean {
    return true;
  }

  protected onOverlayClick(): boolean {
    return true;
  }

  private update(): void {
    this.animationProgress = lerpDelta(
      this.animationProgress,
      this.isOpen ? 1 : 0,
      0.2
    );
    this.gameObject.rectArea!.pos.x =
      -this.drawerWidth * (1 - this.animationProgress);
    this.onUpdate();
  }

  protected onUpdate(): void {}

  private drawOverlay(): void {
    if (this.animationProgress <= 0.01 || this.overlayOpacity <= 0) return;
    drawOverlay({
      r: 0,
      g: 0,
      b: 0,
      a: Math.round(this.overlayOpacity * this.animationProgress * 255),
    });
  }

  private draw(): void {
    if (this.animationProgress <= 0.01) return;

    rlPushMatrix();
    rlTranslatef(-this.drawerWidth * (1 - this.animationProgress), 0, 0);
    this.drawPanel();
    this.drawContent();
    rlPopMatrix();
  }

  private drawPanel(): void {
    const width = this.getPanelRight() - PANEL.x;
    const content = this.getContentRect();
    const alpha = Math.round(PANEL.background.a * this.backgroundOpacity);

    drawRect(PANEL.x, PANEL.y, width, PANEL.headerHeight, { ...PANEL.background, a: alpha });
    drawBorderRect(PANEL.x, PANEL.y, width, PANEL.headerHeight, 2, PANEL.border);
    drawRect(content.x, content.y, content.w, content.h, { ...PANEL.background, a: alpha });
    drawBorderRect(content.x, content.y, content.w, content.h, 2, PANEL.border);

    const titleX = PANEL.x + PANEL.padding;
    const parts = this.getHeaderText().split(" > ");
    let x = titleX;
    parts.forEach((part, index) => {
      const last = index === parts.length - 1;
      const label = last ? part : `${part}  >  `;
      drawText(label, Vector2(x, PANEL.y + 12), 30, last ? PANEL.text : PANEL.dim);
      x += measureText(label, 30).width;
    });
    const subtitle = this.getSubtitleText();
    if (subtitle) {
      drawText(subtitle, Vector2(titleX, PANEL.y + 46), 22, PANEL.dim);
    }

    const mousePos = this.gameObject.getMousePosition();
    const drawIcon = (icon: string, rect: { x: number; y: number; w: number; h: number }) => {
      const hovered = !!mousePos && inRect(mousePos.x, mousePos.y, rect.x, rect.y, rect.w, rect.h);
      const shade = hovered ? 255 : 210;
      drawSprite(icon, Vector2(rect.x, rect.y), Vector2(rect.w, rect.h), {
        r: shade,
        g: shade,
        b: shade,
        a: 255,
      });
    };
    if (this.shouldShowCloseButton()) drawIcon("/icons/x.png", this.getCloseButtonRect());
    if (this.canGoBack()) drawIcon("/icons/chevron-left.png", this.getBackButtonRect());
  }

  protected shouldShowCloseButton(): boolean {
    return true;
  }

  public open(): void {
    this.isOpen = true;
  }

  public close(): void {
    this.isOpen = false;
  }

  public toggle(): void {
    this.isOpen = !this.isOpen;
    playFx("/hover.wav");
  }

  public getGameObject(): GameObject {
    return this.gameObject;
  }

  public setAccentColor(color: AccentColor | null): void {
    this.accentColor = color;
  }

  public setOverlayOpacity(opacity: number): void {
    this.overlayOpacity = opacity;
  }

  public setBackgroundOpacity(opacity: number): void {
    this.backgroundOpacity = opacity;
  }

  public isDrawerOpen(): boolean {
    return this.isOpen;
  }

  public destroy(): void {
    this.isOpen = false;
    this.animationProgress = 0;
  }
}
