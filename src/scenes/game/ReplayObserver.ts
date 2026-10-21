import * as fs from "fs";
import { GetFrameTime } from "raylib";
import * as path from "path";
import { ConfigManager } from "../../utils/configManager";
import { Rhythia } from "../../atoms/Rhythia";
import { clamp } from "../../utils/lerp";
import { SoundSpaceMemoryMap } from "../../utils/storage/ssmm";
import { ModeManager } from "./modes";
import AnonymousMode from "./modes/AnonymousMode";
import { encodeRRE, ReplayCursorSample, ReplayNoteHit } from "../../utils/replays";

type CursorSample = ReplayCursorSample;

export class ReplayObserver {
  private readonly mapId: string | null;
  private readonly mapTitle: string | null;
  private readonly createdAt: number;
  private readonly startFromMs: number;

  private samples: CursorSample[] = [];
  private lastSampleTime: number = Number.NEGATIVE_INFINITY;
  private readonly sampleIntervalMs: number = 16; 
  public recInterval: number = 30;
  public speed: number = 0;
  public topSpeed: number = 0;
  private last = { x: 0, y: 0 };
  private statsFrom = { x: 0, y: 0, time: 0 };
  private elapsed: number = 0;

  private hasAnyData: boolean = false;
  private noteHits: ReplayNoteHit[] = [];

  constructor(
    mapData: SoundSpaceMemoryMap | null | undefined,
    startFromMs: number = 0
  ) {
    this.mapId = mapData?.id ?? null;
    this.mapTitle = mapData?.title ?? null;
    this.startFromMs = Math.max(0, startFromMs | 0);
    this.createdAt = Date.now();
    const notes = Array.isArray(mapData?.notes) ? mapData!.notes : [];
    this.noteHits = notes.map((n) => ({ t: (n?.[0] ?? 0) | 0, hit: false, health: -1 }));
  }

  public recordCursor(timeMs: number, x: number, y: number): void {
    if (!isFinite(timeMs)) return;
    const delta = Math.max(GetFrameTime(), 0.0001);
    const fast = ConfigManager.getExtra<number>("recordLimit", 0) === 1;
    const fpsCap = ConfigManager.getExtra("maxFpsMode", false) ? 0 : Rhythia.maxFps;
    const max = fpsCap ? Math.min(fast ? 240 : 144, fpsCap) : fast ? 240 : 144;
    const min = Math.min(fast ? 60 : 30, max);
    const target = min + (Math.hypot(x - this.last.x, y - this.last.y) / 100 / delta / 12) * (max - min);
    const mode = ConfigManager.getExtra<number>("recordMode", 1);
    const rising = target > this.recInterval;
    this.recInterval = clamp(
      mode === 0 || (mode === 2 && !rising)
        ? target
        : this.recInterval + (target - this.recInterval) * (delta / (mode === 1 && rising ? 0.2 : 2)),
      min,
      max
    );
    this.last = { x, y };
    this.elapsed += delta;
    this.statsFrom.time += delta;
    if (this.statsFrom.time >= 0.1) {
      if (this.elapsed >= 2) {
        this.speed = Math.hypot(x - this.statsFrom.x, y - this.statsFrom.y) / 100 / this.statsFrom.time;
        this.topSpeed = Math.max(this.topSpeed, this.speed);
      }
      this.statsFrom = { x, y, time: 0 };
    }
    if (timeMs - this.lastSampleTime >= 1000 / this.recInterval) {
      this.samples.push({ t: Math.floor(timeMs), x, y });
      this.lastSampleTime = timeMs;
      this.hasAnyData = true;
    }
  }

  
  public recordNoteHit(
    _noteIndex: number,
    timeMs: number,
    x: number,
    y: number,
    health: number
  ): void {
    if (!isFinite(timeMs)) return;
    if (_noteIndex >= 0 && _noteIndex < this.noteHits.length) {
      this.noteHits[_noteIndex].hit = true;
      this.noteHits[_noteIndex].health = Number(health ?? 0);
    }
    
    const last =
      this.samples.length > 0 ? this.samples[this.samples.length - 1] : undefined;
    if (!last || Math.abs(last.t - timeMs) > this.sampleIntervalMs) {
      this.samples.push({ t: Math.floor(timeMs), x, y });
      this.lastSampleTime = timeMs;
      this.hasAnyData = true;
    }
  }

  public resetForRestart(currentTimeMs: number = 0): void {
    this.samples = [];
    this.lastSampleTime = currentTimeMs;
    this.hasAnyData = false;
    this.topSpeed = this.speed = this.elapsed = 0;
    for (let i = 0; i < this.noteHits.length; i++) {
      this.noteHits[i].hit = false;
      this.noteHits[i].health = -1;
    }
  }

  public recordNoteMiss(index: number, health: number): void {
    if (index >= 0 && index < this.noteHits.length) this.noteHits[index].health = Number(health ?? 0);
  }

  public saveToDisk(): string | null {
    try {
      if (
        !this.hasAnyData ||
        !ConfigManager.getExtra("recordReplays", true) ||
        ModeManager.getActiveModeIds().includes(AnonymousMode.id)
      )
        return null;

      const appDataDir = ConfigManager.getAppDataDir();
      const replaysDir = path.join(appDataDir, "replays");
      try {
        if (!fs.existsSync(replaysDir))
          fs.mkdirSync(replaysDir, { recursive: true });
      } catch {}

      const idPart = (this.mapId || "unknown").replace(/[^a-z0-9-_]+/gi, "_");
      const ts = new Date(this.createdAt)
        .toISOString()
        .replace(/[:.]/g, "-")
        .replace("T", "_")
        .split("Z")[0];
      const fileName = `${idPart}_${ts}.rre`;
      const filePath = path.join(replaysDir, fileName);
      const modeStr = (ModeManager.getActiveModeIds() || []).join("+");
      const payload = {
        version: 2,
        meta: {
          mapId: this.mapId,
          title: this.mapTitle,
          createdAt: this.createdAt,
          startFromMs: this.startFromMs,
          mode: modeStr,
        },
        samples: this.samples,
        noteHits: this.noteHits,
      };
      const buf = encodeRRE(payload);
      fs.writeFileSync(filePath, buf);
      return filePath;
    } catch {
      return null;
    }
  }
}
