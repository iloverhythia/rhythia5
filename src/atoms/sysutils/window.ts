import {
  FLAG_BORDERLESS_WINDOWED_MODE,
  FLAG_MSAA_4X_HINT,
  FLAG_WINDOW_RESIZABLE,
  FLAG_WINDOW_ALWAYS_RUN,
  GetCurrentMonitor,
  GetMonitorHeight,
  GetMonitorWidth,
  GetScreenHeight,
  GetScreenWidth,
  GetShaderLocation,
  GuiSetFont,
  InitAudioDevice,
  InitWindow,
  IsKeyDown,
  IsKeyPressed,
  IsWindowFullscreen,
  KEY_ENTER,
  KEY_GRAVE,
  KEY_F1,
  KEY_F11,
  KEY_LEFT_ALT,
  KEY_RIGHT_ALT,
  LoadFontEx,
  LoadImage,
  LoadShader,
  MaximizeWindow,
  SetConfigFlags,
  SetTargetFPS,
  SetWindowIcon,
  SetWindowMonitor,
  ToggleFullscreen,
  UnloadImage,
  rlSetBlendFactorsSeparate,
  rlSetClipPlanes,
  RL_FUNC_ADD,
  RL_MAX,
  RL_ONE,
  RL_ONE_MINUS_SRC_ALPHA,
  RL_SRC_ALPHA,
  SetExitKey,
  SetTextureFilter,
  TEXTURE_FILTER_TRILINEAR,
  KEY_F5,
  FLAG_VSYNC_HINT,
  SetWindowState,
  ClearWindowState,
  SetWindowSize,
  ToggleBorderlessWindowed,
  IsWindowFocused,
  MinimizeWindow,
} from "raylib";

import { state } from "./state";
import { logger } from "../../utils/logger";
import { setDefaultFont } from "../../utils/text";
import { initializeVolumes } from "../../utils/soundManager";
import { restartAppInPlace } from "./scenes";
import { ConfigManager } from "../../utils/configManager";

let borderless = false;
let wasFocused = true;

export function applyWindowSettings(): void {
  const mode = ConfigManager.getExtra<string>("windowMode", "windowed");
  const [width, height] = ConfigManager.getExtra("resolution", "").split("x").map(Number);
  if (IsWindowFullscreen() && mode !== "fullscreen") ToggleFullscreen();
  if (borderless !== (mode === "borderless")) ToggleBorderlessWindowed();
  borderless = mode === "borderless";
  if (mode === "windowed" && width && height) SetWindowSize(width, height);
  if (mode === "fullscreen" && !IsWindowFullscreen()) {
    MaximizeWindow();
    setTimeout(() => ToggleFullscreen(), 50);
  }
  if (ConfigManager.getExtra("vsync", false)) SetWindowState(FLAG_VSYNC_HINT);
  else ClearWindowState(FLAG_VSYNC_HINT);
}

function releaseImage(image: any): void {
  try {
    UnloadImage(image);
  } catch {}
}

export function applyWindowIcon(): void {
  const icon = LoadImage("./public/fav.png");
  SetWindowIcon(icon);
  releaseImage(icon);
}

export function initializeWindow(config: any): void {
  state.targetMonitor = config.targetMonitor;
  state.maxFps = config.maxFps;
  SetConfigFlags(FLAG_MSAA_4X_HINT);
  SetConfigFlags(FLAG_WINDOW_RESIZABLE);
  SetConfigFlags(FLAG_WINDOW_ALWAYS_RUN);
  SetConfigFlags(FLAG_BORDERLESS_WINDOWED_MODE);
  InitWindow(1600, 900, "Rhythia");
  SetExitKey(1);

  InitAudioDevice();
  initializeVolumes();
  applyWindowIcon();
  SetWindowMonitor(state.targetMonitor);
  SetTargetFPS(state.maxFps);
  rlSetClipPlanes(0.01, 14000);
  applyWindowSettings();
}

function loadBloomShader(): void {
  try {
    state.bloomShader = LoadShader("", "./shaders/bloom.fs");
    state.bloomIntensityLocation = state.bloomShader
      ? GetShaderLocation(state.bloomShader, "bloomIntensity")
      : -1;
  } catch {
    logger("Bloom shader not found, bloom effects will be disabled");
    state.bloomShader = null;
    state.bloomIntensityLocation = -1;
  }
}

export function configureRenderingAssets(): void {
  const fontPath = "./public/def2.ttf";
  const baseFontSize = 45;
  const uiFont = LoadFontEx(fontPath, baseFontSize, 0, 0) as any;
  SetTextureFilter(uiFont.texture, TEXTURE_FILTER_TRILINEAR);
  GuiSetFont(uiFont);
  setDefaultFont(uiFont, fontPath);
  rlSetBlendFactorsSeparate(
    RL_SRC_ALPHA,
    RL_ONE_MINUS_SRC_ALPHA,
    RL_ONE,
    RL_ONE,
    RL_FUNC_ADD,
    RL_MAX
  );
  loadBloomShader();
  updateWindowMetrics();
}

export function getDisplaySize(): { width: number; height: number } {
  if (IsWindowFullscreen()) {
    const monitor = GetCurrentMonitor();
    return {
      width: GetMonitorWidth(monitor),
      height: GetMonitorHeight(monitor),
    };
  }
  return {
    width: GetScreenWidth(),
    height: GetScreenHeight(),
  };
}

export function updateWindowMetrics(): void {
  const displaySize = getDisplaySize();
  state.lastWindowWidth = displaySize.width;
  state.lastWindowHeight = displaySize.height;
  state.wasFullscreen = IsWindowFullscreen();
}

export function handleGlobalHotkeys(isFullscreen: boolean): void {
  const altPressed = IsKeyDown(KEY_LEFT_ALT) || IsKeyDown(KEY_RIGHT_ALT);
  const focused = IsWindowFocused();
  if (wasFocused && !focused && (isFullscreen || borderless) && ConfigManager.getExtra("minimizeOnAltTab", false)) {
    MinimizeWindow();
  }
  wasFocused = focused;
  if (IsKeyPressed(KEY_GRAVE)) {
    state.debugMode = !state.debugMode;
  }

  if (IsKeyPressed(KEY_F5)) {
    try {
      void restartAppInPlace();
    } catch {}
  }

  if ((altPressed && IsKeyPressed(KEY_ENTER)) || IsKeyPressed(KEY_F11)) {
    if (!isFullscreen) {
      MaximizeWindow();
      setTimeout(() => {
        ToggleFullscreen();
      }, 50);
    } else {
      ToggleFullscreen();
    }
  }
}
