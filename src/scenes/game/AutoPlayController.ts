import { Vector2 } from "raylib";
import { Rhythia } from "../../atoms/Rhythia";
import { SoundSpaceMemoryMap } from "../../utils/storage/ssmm";
import type { GameSettings } from "../../utils/gameSettingsSchema";
import { state as runtimeState } from "../../atoms/sysutils/state";
import { ConfigManager } from "../../utils/configManager";
import { clamp, lerp } from "../../utils/lerp";
import { ModeManager } from "./modes";

type Point = { x: number; y: number };
type HumanMove = Point & { t: number; bend: number; over: number; react: number; early: number };

const CENTER: Point = { x: 1, y: 1 };
const AIM_RADIUS = 0.2;
const BREAK_MS = 1100;
const mix = (a: Point, b: Point, k: number): Point => ({ x: lerp(a.x, b.x, k), y: lerp(a.y, b.y, k) });
const ease = (t: number, over: number) => {
  const c = clamp(t, 0, 1);
  const s = c * c * c * (10 + c * (-15 + 6 * c));
  return s + over * Math.sin(Math.PI * s) * s;
};

export class AutoPlayController {
  private notes: [number, number, number][] = [];
  private smoothedCursorX: number = 0.5;
  private smoothedCursorY: number = 0.5;
  private lastUpdateTime: number = 0;
  private lastIndex: number = 0;
  private human: HumanMove[] = [];
  private humanIndex: number = 0;
  private speed: number = 1;

  constructor(mapData?: SoundSpaceMemoryMap | null) {
    if (mapData) {
      this.setMapData(mapData);
    }
  }

  public setMapData(mapData: SoundSpaceMemoryMap | null): void {
    this.human = [];
    if (!mapData?.notes || mapData.notes.length === 0) {
      this.notes = [];
      this.reset();
      return;
    }

    const firstNoteTime = mapData.notes[0][0];
    const virtualCenterNote: [number, number, number] = [
      firstNoteTime - 2000,
      0.5,
      0.5,
    ];

    this.notes = [virtualCenterNote, ...mapData.notes];
    this.reset();
    if (ConfigManager.getExtra("realisticAutoplay", false)) this.buildHuman(mapData);
  }

  private buildHuman(mapData: SoundSpaceMemoryMap): void {
    this.speed = Math.max(ModeManager.getMode().musicPitch ?? 1, 0.05);
    const raw: (Point & { t: number })[] = [];
    for (const [t, x, y] of mapData.notes) {
      const last = raw[raw.length - 1];
      if (last && t - last.t < 10) Object.assign(last, mix(last, { x, y }, 0.5));
      else raw.push({ x, y, t });
    }
    let seed = [...String(mapData.id)].reduce((h, c) => Math.imul(h, 31) + c.charCodeAt(0), 7);
    const rand = (min = 0, max = 1) =>
      min + (((seed = (Math.imul(seed, 1103515245) + 12345) | 0) >>> 16) / 65536) * (max - min);
    let prev = CENTER;
    this.human = raw.map((p, i) => {
      const angle = rand(0, Math.PI * 2);
      const radius = AIM_RADIUS * Math.sqrt(rand()) * 0.8;
      const back = Math.hypot(prev.x - p.x, prev.y - p.y);
      const pull = i > 0 && back > 0.001 ? (AIM_RADIUS * 0.25) / back : 0;
      let off = {
        x: Math.cos(angle) * radius + (prev.x - p.x) * pull,
        y: Math.sin(angle) * radius + (prev.y - p.y) * pull,
      };
      const len = Math.hypot(off.x, off.y);
      if (len > AIM_RADIUS) off = { x: (off.x * AIM_RADIUS) / len, y: (off.y * AIM_RADIUS) / len };
      const aim = { x: p.x + off.x, y: p.y + off.y };
      const gap = i > 0 ? (p.t - raw[i - 1].t) / this.speed : 1000;
      const urgency = clamp((Math.hypot(prev.x - aim.x, prev.y - aim.y) / Math.max(gap, 1)) * 250, 0, 1);
      prev = aim;
      return {
        ...aim,
        t: p.t,
        bend: rand(-0.16, 0.16),
        over: urgency * rand(0.02, 0.09),
        react: Math.min(gap * rand(0.08, 0.2), rand(35, 90)),
        early: Math.min(gap * rand(0.05, 0.15), rand(10, 35)),
      };
    });
    this.humanIndex = 0;
  }

  private humanPosition(ms: number): Point {
    const notes = this.human;
    const time = ms / this.speed / 1000;
    const shake = (k: number) => ({
      x: (Math.sin(time * 9.3) + 0.6 * Math.sin(time * 23.1 + 1.7)) * 0.006 * k,
      y: (Math.sin(time * 11.7 + 0.5) + 0.6 * Math.sin(time * 19.9 + 2.9)) * 0.006 * k,
    });
    const shaken = (p: Point, k = 1) => ({ x: p.x + shake(k).x, y: p.y + shake(k).y });
    if (this.humanIndex > 0 && this.humanIndex < notes.length && ms < notes[this.humanIndex - 1].t) this.humanIndex = 0;
    while (this.humanIndex < notes.length && notes[this.humanIndex].t <= ms) this.humanIndex++;
    const idx = this.humanIndex;
    if (idx >= notes.length) {
      const last = notes[notes.length - 1];
      return shaken(mix(last, mix(last, CENTER, 0.6), ease((ms - last.t) / this.speed / 900, 0)));
    }
    const to = notes[idx];
    let from: Point = idx === 0 ? CENTER : notes[idx - 1];
    const fromT = idx === 0 ? to.t - 600 * this.speed : notes[idx - 1].t;
    const gap = (to.t - fromT) / this.speed;
    const now = (ms - fromT) / this.speed;
    let start = to.react;
    let end = gap - to.early;
    if (gap > BREAK_MS && idx > 0) {
      const moveLen = clamp(250 + Math.hypot(to.x - from.x, to.y - from.y) * 160, 250, 600);
      const rest = mix(from, CENTER, 0.45);
      if (now < gap - moveLen) return shaken(mix(from, rest, ease((now / Math.max(gap - moveLen, 1)) * 1.6, 0)));
      from = rest;
      start = gap - moveLen;
    }
    if (end <= start) {
      start = 0;
      end = Math.max(gap * 0.9, 1);
    }
    const t = (now - start) / Math.max(end - start, 1);
    const s = ease(t, to.over);
    const bend = to.bend * Math.sin(Math.PI * clamp(s, 0, 1));
    const p = shaken(mix(from, to, s), 0.4 + 0.6 * Math.sin(Math.PI * clamp(t, 0, 1)));
    return {
      x: clamp(p.x - (to.y - from.y) * bend, -0.5, 2.5),
      y: clamp(p.y + (to.x - from.x) * bend, -0.5, 2.5),
    };
  }

  public reset(): void {
    this.smoothedCursorX = 0.5;
    this.smoothedCursorY = 0.5;
    this.lastUpdateTime = 0;
    this.lastIndex = 0;
  }

  public getCursorScreenPosition(
    currentTime: number,
    settings: Partial<GameSettings>
  ): Vector2 | null {
    if (this.notes.length === 0) {
      return null;
    }

    this.updateCursor(currentTime);

    const playfieldDistance = settings.playfieldDistance ?? 300;
    const userScale = settings.playfieldScale ?? 1.0;
    const playfieldScale = (300 / playfieldDistance) * userScale;
    const scaledOffset = 100 * playfieldScale;

    const gameX = Rhythia.gameWidth / 2 + (this.smoothedCursorX - 1) * scaledOffset;
    const gameY = Rhythia.gameHeight / 2 + (this.smoothedCursorY - 1) * scaledOffset;

    const vp = runtimeState.presentationViewport;
    const screenX = vp.x + (gameX / Rhythia.gameWidth) * vp.width;
    const screenY = vp.y + (gameY / Rhythia.gameHeight) * vp.height;

    return Vector2(screenX, screenY);
  }

  private updateCursor(currentTime: number): void {
    if (this.human.length) {
      const p = this.humanPosition(currentTime);
      this.smoothedCursorX = p.x;
      this.smoothedCursorY = p.y;
      return;
    }
    const notes = this.notes;
    const lastIndex = notes.length - 1;

    if (currentTime <= notes[0][0]) {
      this.smoothedCursorX = 0.5;
      this.smoothedCursorY = 0.5;
      this.lastIndex = 0;
      this.lastUpdateTime = currentTime;
      return;
    }

    if (currentTime >= notes[lastIndex][0]) {
      const lastNote = notes[lastIndex];
      this.smoothedCursorX = lastNote[1];
      this.smoothedCursorY = lastNote[2];
      this.lastIndex = lastIndex - 1;
      this.lastUpdateTime = currentTime;
      return;
    }

    let currentIndex = this.lastIndex;
    if (currentTime >= notes[currentIndex + 1][0]) {
      while (
        currentIndex < notes.length - 2 &&
        currentTime >= notes[currentIndex + 1][0]
      ) {
        currentIndex++;
      }
    } else {
      while (currentIndex > 0 && currentTime < notes[currentIndex][0]) {
        currentIndex--;
      }
    }

    this.lastIndex = currentIndex;

    const nextIndex = Math.min(currentIndex + 1, notes.length - 1);
    const currentNote = notes[currentIndex];
    const nextNote = notes[nextIndex];

    const timeBetween = Math.max(1, nextNote[0] - currentNote[0]);
    const timeProgress = (currentTime - currentNote[0]) / timeBetween;
    const clampedProgress = Math.max(0, Math.min(1, timeProgress));

    const splinePos = this.catmullRomSpline(notes, currentIndex, clampedProgress);

    const deltaTime =
      this.lastUpdateTime > 0
        ? Math.min(currentTime - this.lastUpdateTime, 100)
        : 16;
    this.lastUpdateTime = currentTime;

    const baseSmoothingFactor = 0.82;
    const distance = Math.hypot(
      splinePos.x - this.smoothedCursorX,
      splinePos.y - this.smoothedCursorY
    );
    const adaptiveSmoothing =
      distance > 0.35 ? baseSmoothingFactor * 0.6 : baseSmoothingFactor;
    const frameBlend = 1 - Math.pow(adaptiveSmoothing, deltaTime / 16);

    this.smoothedCursorX += (splinePos.x - this.smoothedCursorX) * frameBlend;
    this.smoothedCursorY += (splinePos.y - this.smoothedCursorY) * frameBlend;
  }

  private catmullRomSpline(
    notes: [number, number, number][],
    index: number,
    t: number
  ): { x: number; y: number } {
    const getPoint = (i: number) => {
      if (i < 0) return { x: notes[0][1], y: notes[0][2] };
      if (i >= notes.length)
        return { x: notes[notes.length - 1][1], y: notes[notes.length - 1][2] };
      return { x: notes[i][1], y: notes[i][2] };
    };

    const p0 = getPoint(index - 1);
    const p1 = getPoint(index);
    const p2 = getPoint(index + 1);
    const p3 = getPoint(index + 2);

    const t2 = t * t;
    const t3 = t2 * t;

    const x =
      0.5 *
      (2 * p1.x +
        (-p0.x + p2.x) * t +
        (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
        (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3);

    const y =
      0.5 *
      (2 * p1.y +
        (-p0.y + p2.y) * t +
        (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
        (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3);

    return { x, y };
  }
}
