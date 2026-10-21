// Browser implementation of the subset of node-raylib used by Rhythia.
// Rendering mirrors rlgl: CPU-side matrix stack, batched quads/triangles/lines, perspective camera.
import { vfs } from "./vfs";

type V2 = { x: number; y: number };
type V3 = { x: number; y: number; z: number };
type Col = { r: number; g: number; b: number; a: number };

export const Vector2 = (x = 0, y = 0): V2 => ({ x, y });
export const Vector3 = (x = 0, y = 0, z = 0): V3 => ({ x, y, z });
export const Vector4 = (x = 0, y = 0, z = 0, w = 0) => ({ x, y, z, w });
export const Color = (r = 0, g = 0, b = 0, a = 255): Col => ({ r, g, b, a });
export const Rectangle = (x = 0, y = 0, width = 0, height = 0) => ({ x, y, width, height });
export const Camera3D = (o: any) => o;

export const LIGHTGRAY = Color(200, 200, 200, 255), GRAY = Color(130, 130, 130, 255), DARKGRAY = Color(80, 80, 80, 255);
export const YELLOW = Color(253, 249, 0, 255), GOLD = Color(255, 203, 0, 255), ORANGE = Color(255, 161, 0, 255);
export const PINK = Color(255, 109, 194, 255), RED = Color(230, 41, 55, 255), MAROON = Color(190, 33, 55, 255);
export const GREEN = Color(0, 228, 48, 255), LIME = Color(0, 158, 47, 255), DARKGREEN = Color(0, 117, 44, 255);
export const SKYBLUE = Color(102, 191, 255, 255), BLUE = Color(0, 121, 241, 255), DARKBLUE = Color(0, 82, 172, 255);
export const PURPLE = Color(200, 122, 255, 255), VIOLET = Color(135, 60, 190, 255), DARKPURPLE = Color(112, 31, 126, 255);
export const BEIGE = Color(211, 176, 131, 255), BROWN = Color(127, 106, 79, 255), DARKBROWN = Color(76, 63, 47, 255);
export const WHITE = Color(255, 255, 255, 255), BLACK = Color(0, 0, 0, 255), BLANK = Color(0, 0, 0, 0);
export const MAGENTA = Color(255, 0, 255, 255), RAYWHITE = Color(245, 245, 245, 255);

export const CAMERA_PERSPECTIVE = 0, CAMERA_ORTHOGRAPHIC = 1;
export const FLAG_VSYNC_HINT = 0x40, FLAG_FULLSCREEN_MODE = 0x2, FLAG_WINDOW_RESIZABLE = 0x4, FLAG_WINDOW_UNDECORATED = 0x8;
export const FLAG_WINDOW_HIDDEN = 0x80, FLAG_WINDOW_MINIMIZED = 0x200, FLAG_WINDOW_MAXIMIZED = 0x400, FLAG_WINDOW_UNFOCUSED = 0x800;
export const FLAG_WINDOW_TOPMOST = 0x1000, FLAG_WINDOW_ALWAYS_RUN = 0x100, FLAG_WINDOW_TRANSPARENT = 0x10, FLAG_WINDOW_HIGHDPI = 0x2000;
export const FLAG_MSAA_4X_HINT = 0x20, FLAG_INTERLACED_HINT = 0x10000, FLAG_BORDERLESS_WINDOWED_MODE = 0x8000;
export const TEXTURE_FILTER_POINT = 0, TEXTURE_FILTER_BILINEAR = 1, TEXTURE_FILTER_TRILINEAR = 2;
export const TEXTURE_FILTER_ANISOTROPIC_4X = 3, TEXTURE_FILTER_ANISOTROPIC_8X = 4, TEXTURE_FILTER_ANISOTROPIC_16X = 5;
export const RL_ZERO = 0, RL_ONE = 1, RL_SRC_COLOR = 0x0300, RL_ONE_MINUS_SRC_COLOR = 0x0301, RL_SRC_ALPHA = 0x0302;
export const RL_ONE_MINUS_SRC_ALPHA = 0x0303, RL_DST_ALPHA = 0x0304, RL_ONE_MINUS_DST_ALPHA = 0x0305, RL_DST_COLOR = 0x0306;
export const RL_FUNC_ADD = 0x8006, RL_MIN = 0x8007, RL_MAX = 0x8008, RL_FUNC_SUBTRACT = 0x800a, RL_FUNC_REVERSE_SUBTRACT = 0x800b;
export const BLEND_ALPHA = 0, BLEND_ADDITIVE = 1, BLEND_MULTIPLIED = 2, BLEND_ADD_COLORS = 3, BLEND_SUBTRACT_COLORS = 4;
export const MOUSE_BUTTON_LEFT = 0, MOUSE_BUTTON_RIGHT = 1, MOUSE_BUTTON_MIDDLE = 2, MOUSE_BUTTON_SIDE = 3, MOUSE_BUTTON_EXTRA = 4;
export const MOUSE_LEFT_BUTTON = 0, MOUSE_RIGHT_BUTTON = 1, MOUSE_MIDDLE_BUTTON = 2;
export const SHADER_UNIFORM_FLOAT = 0, SHADER_UNIFORM_VEC2 = 1, SHADER_UNIFORM_VEC3 = 2, SHADER_UNIFORM_VEC4 = 3, SHADER_UNIFORM_INT = 4;
export const PIXELFORMAT_UNCOMPRESSED_R8G8B8A8 = 7;

// ---------- keyboard codes (GLFW / raylib) ----------
export const KEY_NULL = 0, KEY_APOSTROPHE = 39, KEY_COMMA = 44, KEY_MINUS = 45, KEY_PERIOD = 46, KEY_SLASH = 47;
export const KEY_ZERO = 48, KEY_ONE = 49, KEY_TWO = 50, KEY_THREE = 51, KEY_FOUR = 52, KEY_FIVE = 53, KEY_SIX = 54, KEY_SEVEN = 55, KEY_EIGHT = 56, KEY_NINE = 57;
export const KEY_SEMICOLON = 59, KEY_EQUAL = 61;
export const KEY_A = 65, KEY_B = 66, KEY_C = 67, KEY_D = 68, KEY_E = 69, KEY_F = 70, KEY_G = 71, KEY_H = 72, KEY_I = 73, KEY_J = 74, KEY_K = 75, KEY_L = 76, KEY_M = 77;
export const KEY_N = 78, KEY_O = 79, KEY_P = 80, KEY_Q = 81, KEY_R = 82, KEY_S = 83, KEY_T = 84, KEY_U = 85, KEY_V = 86, KEY_W = 87, KEY_X = 88, KEY_Y = 89, KEY_Z = 90;
export const KEY_LEFT_BRACKET = 91, KEY_BACKSLASH = 92, KEY_RIGHT_BRACKET = 93, KEY_GRAVE = 96, KEY_SPACE = 32;
export const KEY_ESCAPE = 256, KEY_ENTER = 257, KEY_TAB = 258, KEY_BACKSPACE = 259, KEY_INSERT = 260, KEY_DELETE = 261;
export const KEY_RIGHT = 262, KEY_LEFT = 263, KEY_DOWN = 264, KEY_UP = 265, KEY_PAGE_UP = 266, KEY_PAGE_DOWN = 267, KEY_HOME = 268, KEY_END = 269;
export const KEY_CAPS_LOCK = 280, KEY_SCROLL_LOCK = 281, KEY_NUM_LOCK = 282, KEY_PRINT_SCREEN = 283, KEY_PAUSE = 284;
export const KEY_F1 = 290, KEY_F2 = 291, KEY_F3 = 292, KEY_F4 = 293, KEY_F5 = 294, KEY_F6 = 295, KEY_F7 = 296, KEY_F8 = 297, KEY_F9 = 298, KEY_F10 = 299, KEY_F11 = 300, KEY_F12 = 301;
export const KEY_LEFT_SHIFT = 340, KEY_LEFT_CONTROL = 341, KEY_LEFT_ALT = 342, KEY_LEFT_SUPER = 343;
export const KEY_RIGHT_SHIFT = 344, KEY_RIGHT_CONTROL = 345, KEY_RIGHT_ALT = 346, KEY_RIGHT_SUPER = 347, KEY_KB_MENU = 348;
export const KEY_KP_0 = 320, KEY_KP_1 = 321, KEY_KP_2 = 322, KEY_KP_3 = 323, KEY_KP_4 = 324, KEY_KP_5 = 325, KEY_KP_6 = 326, KEY_KP_7 = 327, KEY_KP_8 = 328, KEY_KP_9 = 329;
export const KEY_KP_DECIMAL = 330, KEY_KP_DIVIDE = 331, KEY_KP_MULTIPLY = 332, KEY_KP_SUBTRACT = 333, KEY_KP_ADD = 334, KEY_KP_ENTER = 335, KEY_KP_EQUAL = 336;

const CODE_MAP: Record<string, number> = {
  Space: 32, Quote: 39, Comma: 44, Minus: 45, Period: 46, Slash: 47, Semicolon: 59, Equal: 61,
  BracketLeft: 91, Backslash: 92, BracketRight: 93, Backquote: 96, Escape: 256, Enter: 257, Tab: 258,
  Backspace: 259, Insert: 260, Delete: 261, ArrowRight: 262, ArrowLeft: 263, ArrowDown: 264, ArrowUp: 265,
  PageUp: 266, PageDown: 267, Home: 268, End: 269, CapsLock: 280, ScrollLock: 281, NumLock: 282,
  PrintScreen: 283, Pause: 284, ShiftLeft: 340, ControlLeft: 341, AltLeft: 342, MetaLeft: 343,
  ShiftRight: 344, ControlRight: 345, AltRight: 346, MetaRight: 347, ContextMenu: 348,
  NumpadDecimal: 330, NumpadDivide: 331, NumpadMultiply: 332, NumpadSubtract: 333, NumpadAdd: 334, NumpadEnter: 335, NumpadEqual: 336,
};
for (let i = 0; i < 26; i++) CODE_MAP["Key" + String.fromCharCode(65 + i)] = 65 + i;
for (let i = 0; i < 10; i++) { CODE_MAP["Digit" + i] = 48 + i; CODE_MAP["Numpad" + i] = 320 + i; }
for (let i = 1; i <= 12; i++) CODE_MAP["F" + i] = 289 + i;

// ---------- matrices (column-major) ----------
type M4 = Float32Array;
const ident = (): M4 => { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; };
function mul(a: M4, b: M4): M4 {
  const o = new Float32Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) {
    o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  }
  return o;
}
function translateM(x: number, y: number, z: number): M4 { const m = ident(); m[12] = x; m[13] = y; m[14] = z; return m; }
function scaleM(x: number, y: number, z: number): M4 { const m = ident(); m[0] = x; m[5] = y; m[10] = z; return m; }
function rotateM(deg: number, x: number, y: number, z: number): M4 {
  const len = Math.hypot(x, y, z) || 1; x /= len; y /= len; z /= len;
  const a = deg * Math.PI / 180, s = Math.sin(a), c = Math.cos(a), t = 1 - c;
  const m = ident();
  m[0] = x * x * t + c; m[1] = y * x * t + z * s; m[2] = z * x * t - y * s;
  m[4] = x * y * t - z * s; m[5] = y * y * t + c; m[6] = z * y * t + x * s;
  m[8] = x * z * t + y * s; m[9] = y * z * t - x * s; m[10] = z * z * t + c;
  return m;
}
function frustum(l: number, r: number, b: number, t: number, n: number, f: number): M4 {
  const m = new Float32Array(16);
  m[0] = 2 * n / (r - l); m[5] = 2 * n / (t - b); m[8] = (r + l) / (r - l); m[9] = (t + b) / (t - b);
  m[10] = -(f + n) / (f - n); m[11] = -1; m[14] = -2 * f * n / (f - n);
  return m;
}
function ortho(l: number, r: number, b: number, t: number, n: number, f: number): M4 {
  const m = ident();
  m[0] = 2 / (r - l); m[5] = 2 / (t - b); m[10] = -2 / (f - n);
  m[12] = -(r + l) / (r - l); m[13] = -(t + b) / (t - b); m[14] = -(f + n) / (f - n);
  return m;
}
function lookAt(e: V3, c: V3, u: V3): M4 {
  let zx = e.x - c.x, zy = e.y - c.y, zz = e.z - c.z; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
  let xx = u.y * zz - u.z * zy, xy = u.z * zx - u.x * zz, xz = u.x * zy - u.y * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  const m = ident();
  m[0] = xx; m[4] = xy; m[8] = xz; m[12] = -(xx * e.x + xy * e.y + xz * e.z);
  m[1] = yx; m[5] = yy; m[9] = yz; m[13] = -(yx * e.x + yy * e.y + yz * e.z);
  m[2] = zx; m[6] = zy; m[10] = zz; m[14] = -(zx * e.x + zy * e.y + zz * e.z);
  return m;
}
function invert(m: M4): M4 {
  const a = m, o = new Float32Array(16);
  const b00 = a[0] * a[5] - a[1] * a[4], b01 = a[0] * a[6] - a[2] * a[4], b02 = a[0] * a[7] - a[3] * a[4];
  const b03 = a[1] * a[6] - a[2] * a[5], b04 = a[1] * a[7] - a[3] * a[5], b05 = a[2] * a[7] - a[3] * a[6];
  const b06 = a[8] * a[13] - a[9] * a[12], b07 = a[8] * a[14] - a[10] * a[12], b08 = a[8] * a[15] - a[11] * a[12];
  const b09 = a[9] * a[14] - a[10] * a[13], b10 = a[9] * a[15] - a[11] * a[13], b11 = a[10] * a[15] - a[11] * a[14];
  const det = 1 / (b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06);
  o[0] = (a[5] * b11 - a[6] * b10 + a[7] * b09) * det; o[1] = (-a[1] * b11 + a[2] * b10 - a[3] * b09) * det;
  o[2] = (a[13] * b05 - a[14] * b04 + a[15] * b03) * det; o[3] = (-a[9] * b05 + a[10] * b04 - a[11] * b03) * det;
  o[4] = (-a[4] * b11 + a[6] * b08 - a[7] * b07) * det; o[5] = (a[0] * b11 - a[2] * b08 + a[3] * b07) * det;
  o[6] = (-a[12] * b05 + a[14] * b02 - a[15] * b01) * det; o[7] = (a[8] * b05 - a[10] * b02 + a[11] * b01) * det;
  o[8] = (a[4] * b10 - a[5] * b08 + a[7] * b06) * det; o[9] = (-a[0] * b10 + a[1] * b08 - a[3] * b06) * det;
  o[10] = (a[12] * b04 - a[13] * b02 + a[15] * b00) * det; o[11] = (-a[8] * b04 + a[9] * b02 - a[11] * b00) * det;
  o[12] = (-a[4] * b09 + a[5] * b07 - a[6] * b06) * det; o[13] = (a[0] * b09 - a[1] * b07 + a[2] * b06) * det;
  o[14] = (-a[12] * b03 + a[13] * b01 - a[14] * b00) * det; o[15] = (a[8] * b03 - a[9] * b01 + a[10] * b00) * det;
  return o;
}

// ---------- GL state ----------
let canvas: HTMLCanvasElement;
let gl: WebGL2RenderingContext;
let prog: WebGLProgram, uTex: WebGLUniformLocation;
let vbo: WebGLBuffer, cbo: WebGLBuffer;
let whiteTex: WebGLTexture;
let dpr = 1;
let clipNear = 0.01, clipFar = 1000;

const MAX_VERTS = 65536;
const vPos = new Float32Array(MAX_VERTS * 6);
const vCol = new Uint8Array(MAX_VERTS * 4);
let vCount = 0;
let batchMode = 4; // gl.TRIANGLES
let batchTex: WebGLTexture | null = null;

let proj: M4 = ident();
let view: M4 = ident();
let stack: M4[] = [];
let mvp: M4 = ident();
let mvpDirty = true;
let curDepth = -1;
let in3D = false;
let depthTest = false;

function updateMVP() { if (mvpDirty) { mvp = mul(proj, view); mvpDirty = false; } }

function flush() {
  if (!vCount || !gl) { vCount = 0; return; }
  gl.useProgram(prog);
  gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.bufferData(gl.ARRAY_BUFFER, vPos.subarray(0, vCount * 6), gl.STREAM_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
  gl.bufferData(gl.ARRAY_BUFFER, vCol.subarray(0, vCount * 4), gl.STREAM_DRAW);
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, batchTex || whiteTex);
  gl.drawArrays(batchMode, 0, vCount);
  vCount = 0;
  curDepth = -1;
}
function begin(mode: number, tex: WebGLTexture | null, n: number) {
  if (mode !== batchMode || tex !== batchTex || vCount + n > MAX_VERTS) { flush(); batchMode = mode; batchTex = tex; }
  updateMVP();
}
function vert(x: number, y: number, z: number, u: number, v: number, c: Col) {
  const m = mvp, i = vCount * 6;
  vPos[i] = m[0] * x + m[4] * y + m[8] * z + m[12];
  vPos[i + 1] = m[1] * x + m[5] * y + m[9] * z + m[13];
  vPos[i + 2] = m[2] * x + m[6] * y + m[10] * z + m[14];
  vPos[i + 3] = m[3] * x + m[7] * y + m[11] * z + m[15];
  vPos[i + 4] = u; vPos[i + 5] = v;
  const j = vCount * 4;
  vCol[j] = c.r; vCol[j + 1] = c.g; vCol[j + 2] = c.b; vCol[j + 3] = c.a == null ? 255 : c.a;
  vCount++;
}
function quad(x0: number, y0: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number,
  u0: number, v0: number, u1: number, v1: number, c: Col, tex: WebGLTexture | null) {
  // corners: tl, bl, br, tr
  begin(gl.TRIANGLES, tex, 6);
  const z = curDepth;
  vert(x0, y0, z, u0, v0, c); vert(x1, y1, z, u0, v1, c); vert(x2, y2, z, u1, v1, c);
  vert(x0, y0, z, u0, v0, c); vert(x2, y2, z, u1, v1, c); vert(x3, y3, z, u1, v0, c);
  curDepth += 1 / 20000;
}

const VS = `#version 300 es
in vec4 aPos; in vec2 aUV; in vec4 aCol;
out vec2 vUV; out vec4 vCol;
void main(){ vUV=aUV; vCol=aCol; gl_Position=aPos; }`;
const FS = `#version 300 es
precision mediump float;
in vec2 vUV; in vec4 vCol; uniform sampler2D uTex; out vec4 o;
void main(){ o=texture(uTex,vUV)*vCol; }`;

function compile(type: number, src: string) {
  const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
  return s;
}

// ---------- window ----------
let configFlags = 0;
let targetFps = 0;
let startTime = performance.now();
let lastFrame = performance.now();
let frameTime = 1 / 60;
let fpsAvg = 60;
let screenW = 1, screenH = 1;
let cursorHidden = false;

function resizeCanvas() {
  dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.max(1, Math.round(window.innerWidth * dpr)), h = Math.max(1, Math.round(window.innerHeight * dpr));
  if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
  screenW = w; screenH = h;
}

export function SetConfigFlags(f: number) { configFlags |= f; }
export function InitWindow(_w: number, _h: number, title: string) {
  document.title = title;
  canvas = (document.getElementById("rl") as HTMLCanvasElement) || document.body.appendChild(document.createElement("canvas"));
  canvas.id = "rl";
  gl = canvas.getContext("webgl2", { antialias: true, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false })!;
  if (!gl) throw new Error("WebGL2 is not available in this browser.");
  prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
  gl.bindAttribLocation(prog, 0, "aPos"); gl.bindAttribLocation(prog, 1, "aUV"); gl.bindAttribLocation(prog, 2, "aCol");
  gl.linkProgram(prog);
  uTex = gl.getUniformLocation(prog, "uTex")!;
  gl.useProgram(prog); gl.uniform1i(uTex, 0);
  const vao = gl.createVertexArray(); gl.bindVertexArray(vao);
  vbo = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 24, 0);
  gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 16);
  cbo = gl.createBuffer()!; gl.bindBuffer(gl.ARRAY_BUFFER, cbo);
  gl.enableVertexAttribArray(2); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 4, 0);
  whiteTex = gl.createTexture()!; gl.bindTexture(gl.TEXTURE_2D, whiteTex);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));
  gl.enable(gl.BLEND); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
  gl.disable(gl.CULL_FACE); gl.disable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  gl.pixelStorei(gl.UNPACK_COLORSPACE_CONVERSION_WEBGL, gl.NONE);
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);
  installInput();
  startTime = lastFrame = performance.now();
}
export function CloseWindow() {}
export function WindowShouldClose() { return false; }
export function IsWindowReady() { return !!gl; }
export function SetTargetFPS(f: number) { targetFps = f; }
export function GetFPS() { return Math.round(fpsAvg); }
export function GetFrameTime() { return frameTime; }
export function GetTime() { return (performance.now() - startTime) / 1000; }
export function GetScreenWidth() { return screenW; }
export function GetScreenHeight() { return screenH; }
export function GetRenderWidth() { return screenW; }
export function GetRenderHeight() { return screenH; }
export function GetCurrentMonitor() { return 0; }
export function GetMonitorCount() { return 1; }
export function GetMonitorWidth() { return Math.round(screen.width * dpr); }
export function GetMonitorHeight() { return Math.round(screen.height * dpr); }
export function GetMonitorRefreshRate() { return 60; }
export function GetMonitorName() { return "Browser"; }
export function SetWindowMonitor() {}
export function SetWindowTitle(t: string) { document.title = t; }
export function SetWindowIcon() {}
export function SetWindowSize() {}
export function SetWindowPosition() {}
export function SetWindowState() {}
export function ClearWindowState() {}
export function MaximizeWindow() {}
export function MinimizeWindow() {}
export function RestoreWindow() {}
export function IsWindowFocused() { return document.hasFocus(); }
export function IsWindowMinimized() { return document.hidden; }
export function IsWindowMaximized() { return true; }
export function IsWindowResized() { return false; }
export function IsWindowFullscreen() { return !!document.fullscreenElement; }
export function ToggleFullscreen() {
  try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen().catch(() => {}); } catch {}
}
export function ToggleBorderlessWindowed() { ToggleFullscreen(); }
export function SetExitKey() {}
export function ShowCursor() { cursorHidden = false; canvas.style.cursor = ""; }
export function HideCursor() { cursorHidden = true; canvas.style.cursor = "none"; }
export function IsCursorHidden() { return cursorHidden; }
export function EnableCursor() {
  cursorWanted = false;
  try { if (document.pointerLockElement) document.exitPointerLock(); } catch {}
  ShowCursor();
}
let cursorWanted = false;
export function DisableCursor() {
  cursorWanted = true;
  HideCursor();
  tryLock();
}
function tryLock() {
  if (!cursorWanted || document.pointerLockElement === canvas) return;
  try { const p: any = (canvas as any).requestPointerLock({ unadjustedMovement: true }); if (p && p.catch) p.catch(() => { try { const q: any = canvas.requestPointerLock(); if (q && q.catch) q.catch(() => {}); } catch {} }); } catch {}
}
export function IsCursorOnScreen() { return true; }
let clipboardCache = "";
export function GetClipboardText() { return clipboardCache; }
export function SetClipboardText(t: string) { clipboardCache = t; try { navigator.clipboard.writeText(t).catch(() => {}); } catch {} }
export function OpenURL(url: string) { try { window.open(url, "_blank", "noopener"); } catch {} }
export function TakeScreenshot() {}
export function WaitTime() {}
export function SetTraceLogLevel() {}

// ---------- drawing frame ----------
export function BeginDrawing() {
  resizeCanvas();
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.viewport(0, 0, screenW, screenH);
  proj = ortho(0, screenW, screenH, 0, 0, 1);
  view = ident(); stack = []; mvpDirty = true;
}
export function EndDrawing() {
  flush();
  const now = performance.now();
  frameTime = Math.min(0.25, Math.max(0.0001, (now - lastFrame) / 1000));
  lastFrame = now;
  fpsAvg = fpsAvg * 0.9 + (1 / frameTime) * 0.1;
  pollInput();
}
export function ClearBackground(c: Col) {
  flush();
  gl.clearColor(c.r / 255, c.g / 255, c.b / 255, (c.a ?? 255) / 255);
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
}
export function BeginMode3D(cam: any) {
  flush();
  const aspect = screenW / screenH;
  if (cam.projection === CAMERA_ORTHOGRAPHIC) {
    const top = cam.fovy / 2, right = top * aspect;
    proj = ortho(-right, right, -top, top, clipNear, clipFar);
  } else {
    const top = clipNear * Math.tan(cam.fovy * 0.5 * Math.PI / 180), right = top * aspect;
    proj = frustum(-right, right, -top, top, clipNear, clipFar);
  }
  view = lookAt(cam.position, cam.target, cam.up);
  stack = []; mvpDirty = true; in3D = true;
  rlEnableDepthTest();
}
export function EndMode3D() {
  flush();
  proj = ortho(0, screenW, screenH, 0, 0, 1);
  view = ident(); stack = []; mvpDirty = true; in3D = false;
  rlDisableDepthTest();
}
export function BeginScissorMode(x: number, y: number, w: number, h: number) {
  flush();
  gl.enable(gl.SCISSOR_TEST);
  gl.scissor(Math.round(x), Math.round(screenH - (y + h)), Math.max(0, Math.round(w)), Math.max(0, Math.round(h)));
}
export function EndScissorMode() { flush(); gl.disable(gl.SCISSOR_TEST); }
export function BeginBlendMode(mode: number) {
  flush();
  if (mode === BLEND_ADDITIVE) gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
  else if (mode === BLEND_MULTIPLIED) gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA);
  else gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
}
export function EndBlendMode() { flush(); gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); }
export function BeginShaderMode() {}
export function EndShaderMode() {}
export function BeginTextureMode() {}
export function EndTextureMode() {}

// ---------- rlgl ----------
export function rlPushMatrix() { stack.push(view); }
export function rlPopMatrix() { if (stack.length) { view = stack.pop()!; mvpDirty = true; } }
export function rlLoadIdentity() { view = ident(); mvpDirty = true; }
export function rlTranslatef(x: number, y: number, z: number) { view = mul(view, translateM(x, y, z)); mvpDirty = true; }
export function rlRotatef(a: number, x: number, y: number, z: number) { view = mul(view, rotateM(a, x, y, z)); mvpDirty = true; }
export function rlScalef(x: number, y: number, z: number) { view = mul(view, scaleM(x, y, z)); mvpDirty = true; }
export function rlMultMatrixf(m: ArrayLike<number>) { view = mul(view, Float32Array.from(m as any)); mvpDirty = true; }
export function rlDisableDepthTest() { if (depthTest) { flush(); depthTest = false; gl.disable(gl.DEPTH_TEST); } }
export function rlEnableDepthTest() { if (!depthTest) { flush(); depthTest = true; gl.enable(gl.DEPTH_TEST); } }
export function rlDisableDepthMask() { flush(); gl.depthMask(false); }
export function rlEnableDepthMask() { flush(); gl.depthMask(true); }
export function rlDisableBackfaceCulling() {}
export function rlEnableBackfaceCulling() {}
export function rlSetClipPlanes(n: number, f: number) { clipNear = n; clipFar = f; }
export function rlGetCullDistanceNear() { return clipNear; }
export function rlGetCullDistanceFar() { return clipFar; }
export function rlSetBlendFactorsSeparate() {}
export function rlSetBlendMode(m: number) { BeginBlendMode(m); }
export function rlDrawRenderBatchActive() { flush(); }

// ---------- shapes ----------
export function DrawPixel(x: number, y: number, c: Col) { DrawRectangle(x, y, 1, 1, c); }
export function DrawRectangle(x: number, y: number, w: number, h: number, c: Col) {
  quad(x, y, x, y + h, x + w, y + h, x + w, y, 0, 0, 1, 1, c, null);
}
export function DrawRectangleV(p: V2, s: V2, c: Col) { DrawRectangle(p.x, p.y, s.x, s.y, c); }
export function DrawRectangleRec(r: any, c: Col) { DrawRectangle(r.x, r.y, r.width, r.height, c); }
export function DrawRectanglePro(r: any, o: V2, rot: number, c: Col) {
  const cs = Math.cos(rot * Math.PI / 180), sn = Math.sin(rot * Math.PI / 180);
  const dx = -o.x, dy = -o.y, x = r.x, y = r.y, w = r.width, h = r.height;
  quad(x + dx * cs - dy * sn, y + dx * sn + dy * cs, x + dx * cs - (dy + h) * sn, y + dx * sn + (dy + h) * cs,
    x + (dx + w) * cs - (dy + h) * sn, y + (dx + w) * sn + (dy + h) * cs, x + (dx + w) * cs - dy * sn, y + (dx + w) * sn + dy * cs, 0, 0, 1, 1, c, null);
}
export function DrawRectangleLines(x: number, y: number, w: number, h: number, c: Col) {
  DrawRectangle(x, y, w, 1, c); DrawRectangle(x + w - 1, y + 1, 1, h - 2, c); DrawRectangle(x, y + h - 1, w, 1, c); DrawRectangle(x, y + 1, 1, h - 2, c);
}
export function DrawRectangleLinesEx(r: any, t: number, c: Col) {
  DrawRectangle(r.x, r.y, r.width, t, c); DrawRectangle(r.x, r.y + r.height - t, r.width, t, c);
  DrawRectangle(r.x, r.y + t, t, r.height - 2 * t, c); DrawRectangle(r.x + r.width - t, r.y + t, t, r.height - 2 * t, c);
}
export function DrawRectangleGradientV(x: number, y: number, w: number, h: number, a: Col, b: Col) {
  begin(gl.TRIANGLES, null, 6); const z = curDepth;
  vert(x, y, z, 0, 0, a); vert(x, y + h, z, 0, 1, b); vert(x + w, y + h, z, 1, 1, b);
  vert(x, y, z, 0, 0, a); vert(x + w, y + h, z, 1, 1, b); vert(x + w, y, z, 1, 0, a);
}
export function DrawRectangleGradientH(x: number, y: number, w: number, h: number, a: Col, b: Col) {
  begin(gl.TRIANGLES, null, 6); const z = curDepth;
  vert(x, y, z, 0, 0, a); vert(x, y + h, z, 0, 1, a); vert(x + w, y + h, z, 1, 1, b);
  vert(x, y, z, 0, 0, a); vert(x + w, y + h, z, 1, 1, b); vert(x + w, y, z, 1, 0, b);
}
function lineVerts(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, c: Col) {
  begin(gl.LINES, null, 2); vert(x0, y0, z0, 0, 0, c); vert(x1, y1, z1, 0, 0, c);
}
export function DrawLine(x0: number, y0: number, x1: number, y1: number, c: Col) { lineVerts(x0 + 0.5, y0 + 0.5, curDepth, x1 + 0.5, y1 + 0.5, curDepth, c); }
export function DrawLineV(a: V2, b: V2, c: Col) { lineVerts(a.x, a.y, curDepth, b.x, b.y, curDepth, c); }
export function DrawLine3D(a: V3, b: V3, c: Col) { lineVerts(a.x, a.y, a.z, b.x, b.y, b.z, c); }
export function DrawLineEx(a: V2, b: V2, thick: number, c: Col) {
  const dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy); if (!l) return;
  const nx = -dy / l * thick / 2, ny = dx / l * thick / 2;
  quad(a.x + nx, a.y + ny, a.x - nx, a.y - ny, b.x - nx, b.y - ny, b.x + nx, b.y + ny, 0, 0, 1, 1, c, null);
}
function circleSegments(radius: number, span: number) {
  const th = Math.acos(2 * Math.pow(1 - 0.5 / Math.max(radius, 1), 2) - 1);
  let seg = Math.ceil(span * Math.PI / 180 / (isFinite(th) && th > 0 ? th : 0.1));
  return Math.max(4, Math.min(360, seg || 36));
}
export function DrawCircleSector(cn: V2, r: number, a0: number, a1: number, segments: number, c: Col) {
  if (a1 < a0) { const t = a0; a0 = a1; a1 = t; }
  if (segments < 4) segments = circleSegments(r, a1 - a0);
  const step = (a1 - a0) / segments; let a = a0;
  begin(gl.TRIANGLES, null, segments * 3); const z = curDepth;
  for (let i = 0; i < segments; i++) {
    const r0 = a * Math.PI / 180, r1 = (a + step) * Math.PI / 180;
    vert(cn.x, cn.y, z, 0, 0, c);
    vert(cn.x + Math.cos(r1) * r, cn.y + Math.sin(r1) * r, z, 0, 0, c);
    vert(cn.x + Math.cos(r0) * r, cn.y + Math.sin(r0) * r, z, 0, 0, c);
    a += step;
  }
  curDepth += 1 / 20000;
}
export function DrawCircleV(cn: V2, r: number, c: Col) { DrawCircleSector(cn, r, 0, 360, 36, c); }
export function DrawCircle(x: number, y: number, r: number, c: Col) { DrawCircleV({ x, y }, r, c); }
export function DrawCircleLines(x: number, y: number, r: number, c: Col) {
  const n = 36; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2; DrawLineV({ x: x + Math.cos(a) * r, y: y + Math.sin(a) * r }, { x: x + Math.cos(b) * r, y: y + Math.sin(b) * r }, c); }
}
export function DrawCircleGradient(x: number, y: number, r: number, inner: Col, outer: Col) {
  const n = 36; begin(gl.TRIANGLES, null, n * 3); const z = curDepth;
  for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2;
    vert(x, y, z, 0, 0, inner); vert(x + Math.cos(b) * r, y + Math.sin(b) * r, z, 0, 0, outer); vert(x + Math.cos(a) * r, y + Math.sin(a) * r, z, 0, 0, outer); }
}
export function DrawRing(cn: V2, inner: number, outer: number, a0: number, a1: number, segments: number, c: Col) {
  if (a0 === a1) return;
  if (outer < inner) { const t = outer; outer = inner; inner = t; }
  if (outer <= 0) outer = 0.1;
  if (a1 < a0) { const t = a0; a0 = a1; a1 = t; }
  const minSeg = circleSegments(outer, a1 - a0);
  if (segments < minSeg) segments = minSeg;
  if (inner <= 0) { DrawCircleSector(cn, outer, a0, a1, segments, c); return; }
  const step = (a1 - a0) / segments; let a = a0;
  begin(gl.TRIANGLES, null, segments * 6); const z = curDepth;
  for (let i = 0; i < segments; i++) {
    const r0 = a * Math.PI / 180, r1 = (a + step) * Math.PI / 180;
    const ox0 = cn.x + Math.cos(r0) * outer, oy0 = cn.y + Math.sin(r0) * outer, ix0 = cn.x + Math.cos(r0) * inner, iy0 = cn.y + Math.sin(r0) * inner;
    const ox1 = cn.x + Math.cos(r1) * outer, oy1 = cn.y + Math.sin(r1) * outer, ix1 = cn.x + Math.cos(r1) * inner, iy1 = cn.y + Math.sin(r1) * inner;
    vert(ix0, iy0, z, 0, 0, c); vert(ox0, oy0, z, 0, 0, c); vert(ox1, oy1, z, 0, 0, c);
    vert(ix0, iy0, z, 0, 0, c); vert(ox1, oy1, z, 0, 0, c); vert(ix1, iy1, z, 0, 0, c);
    a += step;
  }
  curDepth += 1 / 20000;
}
export function DrawRingLines(cn: V2, inner: number, outer: number, a0: number, a1: number, segments: number, c: Col) { DrawRing(cn, outer - 1, outer, a0, a1, segments, c); }
export function DrawTriangle(a: V2, b: V2, cc: V2, c: Col) {
  begin(gl.TRIANGLES, null, 3); const z = curDepth; vert(a.x, a.y, z, 0, 0, c); vert(b.x, b.y, z, 0, 0, c); vert(cc.x, cc.y, z, 0, 0, c);
}
export function DrawTriangle3D(a: V3, b: V3, cc: V3, c: Col) {
  begin(gl.TRIANGLES, null, 3); vert(a.x, a.y, a.z, 0, 0, c); vert(b.x, b.y, b.z, 0, 0, c); vert(cc.x, cc.y, cc.z, 0, 0, c);
}
export function DrawPoly(cn: V2, sides: number, r: number, rot: number, c: Col) {
  begin(gl.TRIANGLES, null, sides * 3); const z = curDepth;
  for (let i = 0; i < sides; i++) { const a = (rot + i * 360 / sides) * Math.PI / 180, b = (rot + (i + 1) * 360 / sides) * Math.PI / 180;
    vert(cn.x, cn.y, z, 0, 0, c); vert(cn.x + Math.cos(b) * r, cn.y + Math.sin(b) * r, z, 0, 0, c); vert(cn.x + Math.cos(a) * r, cn.y + Math.sin(a) * r, z, 0, 0, c); }
}
export function DrawPlane(cn: V3, size: V2, c: Col) {
  begin(gl.TRIANGLES, null, 6); const x0 = cn.x - size.x / 2, x1 = cn.x + size.x / 2, z0 = cn.z - size.y / 2, z1 = cn.z + size.y / 2;
  vert(x0, cn.y, z0, 0, 0, c); vert(x0, cn.y, z1, 0, 0, c); vert(x1, cn.y, z1, 0, 0, c);
  vert(x0, cn.y, z0, 0, 0, c); vert(x1, cn.y, z1, 0, 0, c); vert(x1, cn.y, z0, 0, 0, c);
}
export function DrawCube(p: V3, w: number, h: number, l: number, c: Col) {
  const x = p.x, y = p.y, z = p.z, a = w / 2, b = h / 2, d = l / 2;
  const f = (pts: number[][]) => { begin(gl.TRIANGLES, null, 6); for (const i of [0, 1, 2, 0, 2, 3]) vert(pts[i][0], pts[i][1], pts[i][2], 0, 0, c); };
  f([[x - a, y - b, z + d], [x + a, y - b, z + d], [x + a, y + b, z + d], [x - a, y + b, z + d]]);
  f([[x - a, y - b, z - d], [x - a, y + b, z - d], [x + a, y + b, z - d], [x + a, y - b, z - d]]);
  f([[x - a, y + b, z - d], [x - a, y + b, z + d], [x + a, y + b, z + d], [x + a, y + b, z - d]]);
  f([[x - a, y - b, z - d], [x + a, y - b, z - d], [x + a, y - b, z + d], [x - a, y - b, z + d]]);
  f([[x + a, y - b, z - d], [x + a, y + b, z - d], [x + a, y + b, z + d], [x + a, y - b, z + d]]);
  f([[x - a, y - b, z - d], [x - a, y - b, z + d], [x - a, y + b, z + d], [x - a, y + b, z - d]]);
}
export function DrawGrid() {}
export const Fade = (c: Col, a: number): Col => ({ r: c.r, g: c.g, b: c.b, a: Math.round(255 * Math.max(0, Math.min(1, a))) });
export const ColorFromHSV = (hue: number, saturation: number, value: number): Col => {
  const f = (n: number) => {
    const k = (n + hue / 60) % 6;
    return Math.round(255 * (value - value * saturation * Math.max(0, Math.min(k, 4 - k, 1))));
  };
  return { r: f(5), g: f(3), b: f(1), a: 255 };
};
export const ColorAlpha = Fade;
export const ColorToInt = (c: Col) => ((c.r << 24) | (c.g << 16) | (c.b << 8) | c.a) >>> 0;
export const GetColor = (h: number): Col => ({ r: (h >>> 24) & 255, g: (h >>> 16) & 255, b: (h >>> 8) & 255, a: h & 255 });
export function CheckCollisionPointRec(p: V2, r: any) { return p.x >= r.x && p.x < r.x + r.width && p.y >= r.y && p.y < r.y + r.height; }
export function CheckCollisionRecs(a: any, b: any) { return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y; }
export function CheckCollisionPointCircle(p: V2, c: V2, r: number) { return Math.hypot(p.x - c.x, p.y - c.y) <= r; }

// ---------- camera rays ----------
export function GetScreenToWorldRayEx(pos: V2, cam: any, w: number, h: number) {
  const x = (2 * pos.x) / w - 1, y = 1 - (2 * pos.y) / h;
  const v = lookAt(cam.position, cam.target, cam.up);
  let p: M4;
  if (cam.projection === CAMERA_ORTHOGRAPHIC) { const top = cam.fovy / 2, right = top * (w / h); p = ortho(-right, right, -top, top, clipNear, clipFar); }
  else { const top = clipNear * Math.tan(cam.fovy * 0.5 * Math.PI / 180), right = top * (w / h); p = frustum(-right, right, -top, top, clipNear, clipFar); }
  const inv = invert(mul(p, v));
  const un = (zz: number) => {
    const X = inv[0] * x + inv[4] * y + inv[8] * zz + inv[12], Y = inv[1] * x + inv[5] * y + inv[9] * zz + inv[13];
    const Z = inv[2] * x + inv[6] * y + inv[10] * zz + inv[14], W = inv[3] * x + inv[7] * y + inv[11] * zz + inv[15];
    return { x: X / W, y: Y / W, z: Z / W };
  };
  const n = un(-1), f = un(1);
  let dx = f.x - n.x, dy = f.y - n.y, dz = f.z - n.z; const l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l;
  const position = cam.projection === CAMERA_ORTHOGRAPHIC ? n : { x: cam.position.x, y: cam.position.y, z: cam.position.z };
  return { position, direction: { x: dx, y: dy, z: dz } };
}
export function GetScreenToWorldRay(pos: V2, cam: any) { return GetScreenToWorldRayEx(pos, cam, screenW, screenH); }
export function GetWorldToScreenEx(p: V3, cam: any, w: number, h: number) {
  const top = clipNear * Math.tan(cam.fovy * 0.5 * Math.PI / 180), right = top * (w / h);
  const m = mul(frustum(-right, right, -top, top, clipNear, clipFar), lookAt(cam.position, cam.target, cam.up));
  const X = m[0] * p.x + m[4] * p.y + m[8] * p.z + m[12], Y = m[1] * p.x + m[5] * p.y + m[9] * p.z + m[13], W = m[3] * p.x + m[7] * p.y + m[11] * p.z + m[15];
  return { x: (X / W + 1) / 2 * w, y: (1 - (Y / W + 1) / 2) * h };
}
export function GetWorldToScreen(p: V3, cam: any) { return GetWorldToScreenEx(p, cam, screenW, screenH); }

// ---------- textures & images ----------
type Tex = { id: number; width: number; height: number; mipmaps: number; format: number; _gl: WebGLTexture | null; _filter: number; _src?: any };
let texIds = 1;
const bitmapCache = new Map<string, ImageBitmap | HTMLCanvasElement>();
export function registerBitmap(path: string, bmp: ImageBitmap | HTMLCanvasElement) { bitmapCache.set(vfs.norm(path), bmp); }

function uploadTexture(t: Tex, src: TexImageSource | null, w: number, h: number, data?: ArrayBufferView) {
  if (!t._gl) t._gl = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, t._gl);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  if (src) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
  else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, data || null);
  t.width = w; t.height = h;
  applyFilter(t, t._filter);
}
function applyFilter(t: Tex, f: number) {
  t._filter = f;
  if (!t._gl || !t.width) return;
  flush();
  gl.bindTexture(gl.TEXTURE_2D, t._gl);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (f >= TEXTURE_FILTER_TRILINEAR) {
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    const ext = gl.getExtension("EXT_texture_filter_anisotropic");
    if (ext && f >= TEXTURE_FILTER_ANISOTROPIC_4X) gl.texParameterf(gl.TEXTURE_2D, ext.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  } else {
    const m = f === TEXTURE_FILTER_POINT ? gl.NEAREST : gl.LINEAR;
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, m);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, m);
  }
}
function newTex(): Tex { return { id: texIds++, width: 0, height: 0, mipmaps: 1, format: 7, _gl: null, _filter: TEXTURE_FILTER_BILINEAR }; }

type Img = { data: any; width: number; height: number; mipmaps: number; format: number; _src: TexImageSource | null; _ready: Promise<void> | null; _waiters: Tex[] };
function newImg(): Img { return { data: null, width: 0, height: 0, mipmaps: 1, format: 7, _src: null, _ready: null, _waiters: [] }; }
function fillImg(img: Img, src: ImageBitmap | HTMLCanvasElement) {
  img._src = src; img.width = src.width; img.height = src.height;
  for (const t of img._waiters) uploadTexture(t, src, src.width, src.height);
  img._waiters = [];
}
function decodeInto(img: Img, bytes: Uint8Array, mime?: string) {
  img._ready = createImageBitmap(new Blob([bytes], mime ? { type: mime } : {}), { premultiplyAlpha: "none", colorSpaceConversion: "none" } as any)
    .then((b) => fillImg(img, b)).catch((e) => console.warn("image decode failed", e));
}
function mimeFor(p: string) {
  const e = p.toLowerCase().split(".").pop() || "";
  return e === "png" ? "image/png" : e === "jpg" || e === "jpeg" ? "image/jpeg" : e === "gif" ? "image/gif" : e === "webp" ? "image/webp" : e === "bmp" ? "image/bmp" : undefined;
}

export function LoadImage(path: string): Img {
  const img = newImg();
  const cached = bitmapCache.get(vfs.norm(path));
  if (cached) { fillImg(img, cached as any); return img; }
  const bytes = vfs.peek(path);
  if (bytes) decodeInto(img, bytes, mimeFor(path));
  return img;
}
export function LoadImageFromMemory(fileType: string, data: any, _size?: number): Img {
  const img = newImg();
  const bytes = data instanceof Uint8Array ? data : new Uint8Array(data);
  decodeInto(img, bytes, mimeFor("x" + (fileType || "")));
  return img;
}
export function LoadImageAnimFromMemory(fileType: string, data: any, size?: number, frames?: any) {
  if (frames && typeof frames === "object") frames.value = 1;
  return LoadImageFromMemory(fileType, data, size);
}
export function GenImageColor(w: number, h: number, c: Col): Img {
  const img = newImg(); const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) { data[i * 4] = c.r; data[i * 4 + 1] = c.g; data[i * 4 + 2] = c.b; data[i * 4 + 3] = c.a; }
  img.data = data; img.width = w; img.height = h; return img;
}
export function IsImageReady(img: Img) { return !!img && img.width > 0; }
export function IsImageValid(img: Img) { return IsImageReady(img); }
export function UnloadImage() {}
export function ImageResize() {}
export function ExportImage() { return false; }
export function LoadTexture(path: string): Tex {
  const t = newTex();
  const key = vfs.norm(path);
  const cached = bitmapCache.get(key);
  if (cached) { uploadTexture(t, cached as any, cached.width, cached.height); return t; }
  const img = LoadImage(path); img._waiters.push(t);
  if (img._ready) img._ready.then(() => { if (img._src) bitmapCache.set(key, img._src as any); });
  return t;
}
export function LoadTextureFromImage(img: Img): Tex {
  const t = newTex();
  if (img._src) uploadTexture(t, img._src, img.width, img.height);
  else if (img.data) uploadTexture(t, null, img.width, img.height, img.data);
  else img._waiters.push(t);
  return t;
}
export function UpdateTexture(t: Tex, pixels: any) {
  if (!t._gl || !t.width) return;
  flush();
  gl.bindTexture(gl.TEXTURE_2D, t._gl);
  const data = pixels instanceof Uint8Array ? pixels : new Uint8Array(pixels.buffer || pixels);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, t.width, t.height, gl.RGBA, gl.UNSIGNED_BYTE, data);
}
export function UnloadTexture(t: Tex) { if (t && t._gl && !(t as any)._font) { flush(); gl.deleteTexture(t._gl); t._gl = null; } }
export function IsTextureReady(t: Tex) { return !!t && t.width > 0; }
export function IsTextureValid(t: Tex) { return IsTextureReady(t); }
export function SetTextureFilter(t: Tex, f: number) { if (t) applyFilter(t, f); }
export function SetTextureWrap() {}
export function GenTextureMipmaps(t: Tex) { applyFilter(t, TEXTURE_FILTER_TRILINEAR); }

export function DrawTexturePro(t: Tex, src: any, dst: any, origin: V2, rot: number, c: Col) {
  if (!t || !t._gl || !t.width) return;
  let sw = src.width, sh = src.height, flipX = false, flipY = false;
  if (sw < 0) { flipX = true; sw = -sw; }
  if (sh < 0) { flipY = true; sh = -sh; }
  let u0 = src.x / t.width, u1 = (src.x + sw) / t.width, v0 = src.y / t.height, v1 = (src.y + sh) / t.height;
  if (flipX) { const k = u0; u0 = u1; u1 = k; }
  if (flipY) { const k = v0; v0 = v1; v1 = k; }
  const w = dst.width, h = dst.height;
  let ox = origin ? origin.x : 0, oy = origin ? origin.y : 0;
  if (!rot) {
    const x = dst.x - ox, y = dst.y - oy;
    quad(x, y, x, y + h, x + w, y + h, x + w, y, u0, v0, u1, v1, c, t._gl);
  } else {
    const s = Math.sin(rot * Math.PI / 180), cs = Math.cos(rot * Math.PI / 180), x = dst.x, y = dst.y, dx = -ox, dy = -oy;
    quad(x + dx * cs - dy * s, y + dx * s + dy * cs, x + dx * cs - (dy + h) * s, y + dx * s + (dy + h) * cs,
      x + (dx + w) * cs - (dy + h) * s, y + (dx + w) * s + (dy + h) * cs, x + (dx + w) * cs - dy * s, y + (dx + w) * s + dy * cs, u0, v0, u1, v1, c, t._gl);
  }
}
export function DrawTexture(t: Tex, x: number, y: number, c: Col) { if (t) DrawTexturePro(t, { x: 0, y: 0, width: t.width, height: t.height }, { x, y, width: t.width, height: t.height }, { x: 0, y: 0 }, 0, c); }
export function DrawTextureV(t: Tex, p: V2, c: Col) { DrawTexture(t, p.x, p.y, c); }
export function DrawTextureEx(t: Tex, p: V2, rot: number, scale: number, c: Col) {
  if (t) DrawTexturePro(t, { x: 0, y: 0, width: t.width, height: t.height }, { x: p.x, y: p.y, width: t.width * scale, height: t.height * scale }, { x: 0, y: 0 }, rot, c);
}
export function DrawTextureRec(t: Tex, src: any, p: V2, c: Col) {
  if (t) DrawTexturePro(t, src, { x: p.x, y: p.y, width: Math.abs(src.width), height: Math.abs(src.height) }, { x: 0, y: 0 }, 0, c);
}

// ---------- shaders (bloom is loaded but never bound by the game) ----------
export function LoadShader() { return { id: 1, locs: [] }; }
export function LoadShaderFromMemory() { return { id: 1, locs: [] }; }
export function GetShaderLocation() { return 0; }
export function SetShaderValue() {}
export function SetShaderValueTexture() {}
export function UnloadShader() {}
export function IsShaderReady() { return true; }
export function LoadRenderTexture(w: number, h: number) { const t = newTex(); return { id: t.id, texture: t, depth: newTex() }; }
export function UnloadRenderTexture() {}

// ---------- fonts ----------
// Fonts are registered at boot (FontFace + hhea metrics) so glyphs rasterize synchronously.
type FontMeta = { family: string; upem: number; asc: number; desc: number };
const fontMeta = new Map<string, FontMeta>();
export function registerFont(path: string, meta: FontMeta) { fontMeta.set(vfs.norm(path), meta); }
type Glyph = { x: number; y: number; w: number; left: number; adv: number };
type FontInt = { meta: FontMeta; size: number; canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D; glyphs: Map<number, Glyph>; penX: number; penY: number; rowH: number; dirty: boolean; pad: number; tex: Tex };
let guiFont: any = null;

function mkFont(meta: FontMeta, size: number) {
  size = Math.max(4, Math.round(size));
  const cv = document.createElement("canvas");
  const pad = 4;
  cv.width = 2048; cv.height = Math.min(4096, Math.max(64, Math.pow(2, Math.ceil(Math.log2((size + pad * 2) * 3)))));
  const ctx = cv.getContext("2d", { willReadFrequently: false })!;
  const f: FontInt = { meta, size, canvas: cv, ctx, glyphs: new Map(), penX: 0, penY: 0, rowH: size + pad * 2, dirty: true, pad, tex: newTex() };
  (f.tex as any)._font = true;
  f.tex._filter = TEXTURE_FILTER_BILINEAR;
  for (let c = 32; c < 127; c++) addGlyph(f, c);
  const font: any = { baseSize: size, glyphCount: 95, glyphPadding: pad, texture: f.tex, recs: [], glyphs: [], _f: f };
  return font;
}
function setCtxFont(f: FontInt) {
  const px = f.size * f.meta.upem / (f.meta.asc - f.meta.desc);
  f.ctx.font = `${px}px "${f.meta.family}"`;
  f.ctx.textBaseline = "alphabetic";
  f.ctx.fillStyle = "#fff";
}
function addGlyph(f: FontInt, code: number) {
  setCtxFont(f);
  const ch = String.fromCodePoint(code);
  const m = f.ctx.measureText(ch);
  const adv = Math.floor(m.width);
  const left = Math.max(0, Math.ceil(m.actualBoundingBoxLeft || 0));
  const right = Math.max(adv, Math.ceil(m.actualBoundingBoxRight || 0));
  const w = left + right + f.pad * 2;
  if (f.penX + w > f.canvas.width) { f.penX = 0; f.penY += f.rowH; }
  if (f.penY + f.rowH > f.canvas.height) {
    const old = f.canvas; const nc = document.createElement("canvas"); nc.width = old.width; nc.height = old.height * 2;
    const nctx = nc.getContext("2d")!; nctx.drawImage(old, 0, 0); f.canvas = nc; f.ctx = nctx; setCtxFont(f);
  }
  const base = f.size * f.meta.asc / (f.meta.asc - f.meta.desc);
  f.ctx.fillText(ch, f.penX + f.pad + left, f.penY + f.pad + base);
  const g = { x: f.penX, y: f.penY, w, left, adv };
  f.glyphs.set(code, g);
  f.penX += w + 1;
  f.dirty = true;
  return g;
}
function glyphFor(f: FontInt, code: number) { return f.glyphs.get(code) || f.glyphs.get(63)!; }
function syncFontTex(f: FontInt) {
  if (!f.dirty) return;
  f.dirty = false;
  flush();
  uploadTexture(f.tex, f.canvas, f.canvas.width, f.canvas.height);
}
export function LoadFont(path: string) { return LoadFontEx(path, 32, 0, 0); }
export function LoadFontEx(path: string, size: number, _cp?: any, _n?: number) {
  const meta = fontMeta.get(vfs.norm(path)) || { family: "sans-serif", upem: 1000, asc: 800, desc: -200 };
  return mkFont(meta, size);
}
export function GetFontDefault() { return guiFont || (guiFont = mkFont({ family: "sans-serif", upem: 1000, asc: 800, desc: -200 }, 20)); }
export function GuiGetFont() { return guiFont || GetFontDefault(); }
export function GuiSetFont(f: any) { guiFont = f; }
export function UnloadFont() {}
export function IsFontReady() { return true; }
export function MeasureTextEx(font: any, text: string, fontSize: number, spacing: number): V2 {
  if (!font || !font._f || !text) return { x: 0, y: 0 };
  const f: FontInt = font._f;
  const scale = fontSize / f.size;
  let lineW = 0, maxW = 0, len = 0, maxLen = 0, h = fontSize;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code === 10) { if (lineW > maxW) maxW = lineW; if (len > maxLen) maxLen = len; lineW = 0; len = 0; h += fontSize + 2; continue; }
    len++;
    lineW += glyphFor(f, code).adv;
  }
  if (lineW > maxW) maxW = lineW; if (len > maxLen) maxLen = len;
  return { x: maxW * scale + (maxLen - 1) * spacing, y: h };
}
export function MeasureText(text: string, fontSize: number) { return MeasureTextEx(GetFontDefault(), text, fontSize, Math.max(1, fontSize / 10)).x; }
export function DrawTextEx(font: any, text: string, pos: V2, fontSize: number, spacing: number, c: Col) {
  if (!font || !font._f || !text) return;
  const f: FontInt = font._f;
  syncFontTex(f);
  const scale = fontSize / f.size;
  let x = 0, y = 0;
  const cellH = (f.size + f.pad * 2) * scale;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    if (code === 10) { x = 0; y += fontSize + 2; continue; }
    const g = glyphFor(f, code);
    if (code !== 32 && code !== 9) {
      const gx = pos.x + x - (f.pad + g.left) * scale, gy = pos.y + y - f.pad * scale, gw = g.w * scale;
      const u0 = g.x / f.canvas.width, v0 = g.y / f.canvas.height, u1 = (g.x + g.w) / f.canvas.width, v1 = (g.y + f.size + f.pad * 2) / f.canvas.height;
      quad(gx, gy, gx, gy + cellH, gx + gw, gy + cellH, gx + gw, gy, u0, v0, u1, v1, c, f.tex._gl);
    }
    x += g.adv * scale + spacing;
  }
}
export function DrawText(text: string, x: number, y: number, size: number, c: Col) { DrawTextEx(GetFontDefault(), text, { x, y }, size, Math.max(1, size / 10), c); }
export function DrawFPS(x: number, y: number) { DrawText(GetFPS() + " FPS", x, y, 20, GREEN); }

// ---------- input ----------
const keyDown = new Set<number>(), keyPressed = new Set<number>(), keyReleased = new Set<number>(), keyRepeat = new Set<number>();
const mouseDown = new Set<number>(), mousePressed = new Set<number>(), mouseReleased = new Set<number>();
type Ev = { t: "kd" | "ku" | "md" | "mu" | "kr"; c: number };
let evQ: Ev[] = [];
const keyQueue: number[] = [], charQueue: number[] = [];
let mouseX = 0, mouseY = 0, dX = 0, dY = 0, frameDX = 0, frameDY = 0, wheelAcc = 0, wheel = 0;

function installInput() {
  const isTyping = () => { const a = document.activeElement; return !!a && (a.tagName === "INPUT" || a.tagName === "TEXTAREA"); };
  window.addEventListener("keydown", (e) => {
    if (isTyping()) return;
    const c = CODE_MAP[e.code];
    if (c) {
      if (e.repeat) evQ.push({ t: "kr", c }); else evQ.push({ t: "kd", c });
      keyQueue.push(c);
      if (c === KEY_TAB || c === KEY_SPACE || c === KEY_BACKSPACE || (c >= KEY_RIGHT && c <= KEY_END) || c === KEY_F5 || c === KEY_F11 || c === KEY_F1 || c === KEY_F2 || c === KEY_F3 || c === KEY_GRAVE || c === KEY_ESCAPE) e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && (c === KEY_R || c === KEY_S || c === KEY_F)) e.preventDefault();
    }
    if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) charQueue.push(e.key.codePointAt(0)!);
  });
  window.addEventListener("keyup", (e) => { const c = CODE_MAP[e.code]; if (c) evQ.push({ t: "ku", c }); });
  window.addEventListener("blur", () => { for (const k of keyDown) evQ.push({ t: "ku", c: k }); for (const b of mouseDown) evQ.push({ t: "mu", c: b }); });
  const btn = (b: number) => (b === 0 ? 0 : b === 2 ? 1 : b === 1 ? 2 : b);
  canvas.addEventListener("pointerdown", (e) => {
    mouseX = e.offsetX * dpr; mouseY = e.offsetY * dpr; evQ.push({ t: "md", c: btn(e.button) });
    resumeAudio(); tryLock();
  });
  window.addEventListener("pointerup", (e) => { evQ.push({ t: "mu", c: btn(e.button) }); });
  window.addEventListener("pointermove", (e) => {
    if (document.pointerLockElement === canvas) { dX += e.movementX * dpr; dY += e.movementY * dpr; mouseX += e.movementX * dpr; mouseY += e.movementY * dpr; }
    else { const r = canvas.getBoundingClientRect(); const nx = (e.clientX - r.left) * dpr, ny = (e.clientY - r.top) * dpr; dX += nx - mouseX; dY += ny - mouseY; mouseX = nx; mouseY = ny; }
  });
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); const k = e.deltaMode === 1 ? 1 / 3 : e.deltaMode === 2 ? 1 : 1 / 100; wheelAcc += -e.deltaY * k; }, { passive: false });
  window.addEventListener("paste", (e) => { const t = e.clipboardData?.getData("text"); if (t != null) { clipboardCache = t; } });
  window.addEventListener("keydown", resumeAudio, { once: true });
}
function pollInput() {
  keyPressed.clear(); keyReleased.clear(); keyRepeat.clear(); mousePressed.clear(); mouseReleased.clear();
  // A release that arrives in the same frame as its press is held back one frame,
  // so code that waits for "pressed, then released later" still sees both.
  const carry: Ev[] = [];
  for (const e of evQ) {
    if (e.t === "kd") { keyPressed.add(e.c); keyDown.add(e.c); }
    else if (e.t === "kr") { keyRepeat.add(e.c); keyDown.add(e.c); }
    else if (e.t === "ku") { if (keyPressed.has(e.c)) { carry.push(e); continue; } if (keyDown.has(e.c)) keyReleased.add(e.c); keyDown.delete(e.c); }
    else if (e.t === "md") { mousePressed.add(e.c); mouseDown.add(e.c); }
    else if (e.t === "mu") { if (mousePressed.has(e.c)) { carry.push(e); continue; } if (mouseDown.has(e.c)) mouseReleased.add(e.c); mouseDown.delete(e.c); }
  }
  evQ = carry;
  frameDX = dX; frameDY = dY; dX = 0; dY = 0;
  wheel = wheelAcc; wheelAcc = 0;
  updateAudioClock();
}
export function IsKeyPressed(k: number) { return keyPressed.has(k); }
export function IsKeyPressedRepeat(k: number) { return keyRepeat.has(k); }
export function IsKeyDown(k: number) { return keyDown.has(k) || keyPressed.has(k); }
export function IsKeyReleased(k: number) { return keyReleased.has(k); }
export function IsKeyUp(k: number) { return !IsKeyDown(k); }
export function GetKeyPressed() { return keyQueue.shift() || 0; }
export function GetCharPressed() { return charQueue.shift() || 0; }
export function IsMouseButtonPressed(b: number) { return mousePressed.has(b); }
export function IsMouseButtonDown(b: number) { return mouseDown.has(b) || mousePressed.has(b); }
export function IsMouseButtonReleased(b: number) { return mouseReleased.has(b); }
export function IsMouseButtonUp(b: number) { return !IsMouseButtonDown(b); }
export function GetMousePosition(): V2 { return { x: mouseX, y: mouseY }; }
export function GetMouseX() { return Math.round(mouseX); }
export function GetMouseY() { return Math.round(mouseY); }
export function GetMouseDelta(): V2 { return { x: frameDX, y: frameDY }; }
export function GetMouseWheelMove() { return wheel; }
export function GetMouseWheelMoveV(): V2 { return { x: 0, y: wheel }; }
export function SetMousePosition(x: number, y: number) { mouseX = x; mouseY = y; }
export function SetMouseCursor() {}
export function GetTouchPointCount() { return 0; }
export function GetGamepadName() { return ""; }
export function IsGamepadAvailable() { return false; }

// ---------- audio ----------
let AC: AudioContext | null = null;
let master: GainNode | null = null;
let masterVol = 1;
function ctx() {
  if (!AC) {
    AC = new (window.AudioContext || (window as any).webkitAudioContext)({ latencyHint: "interactive" });
    master = AC.createGain(); master.gain.value = masterVol; master.connect(AC.destination);
  }
  return AC;
}
function resumeAudio() { try { const a = ctx(); if (a.state === "suspended") a.resume(); } catch {} }
export function InitAudioDevice() { ctx(); }
export function CloseAudioDevice() {}
export function IsAudioDeviceReady() { return !!AC; }
export function SetMasterVolume(v: number) { masterVol = v; if (master) master.gain.value = v; }
export function GetMasterVolume() { return masterVol; }

const decodeCache = new Map<string, Promise<AudioBuffer | null>>();
function decodePath(path: string): Promise<AudioBuffer | null> {
  const key = vfs.norm(path);
  let p = decodeCache.get(key);
  if (!p) {
    p = vfs.readAsync(path).then((b) => (b ? ctx().decodeAudioData(b.slice().buffer) : null)).catch((e) => { console.warn("audio decode failed", path, e); return null; });
    decodeCache.set(key, p);
  }
  return p;
}
export function forgetAudio(path: string) { decodeCache.delete(vfs.norm(path)); }

type Snd = { _buf: AudioBuffer | null; _vol: number; _pitch: number; _pan: number; _src: AudioBufferSourceNode | null; _gain: GainNode | null; _pend: boolean; frameCount: number; stream: any };
export function LoadSound(path: string): Snd {
  const s: Snd = { _buf: null, _vol: 1, _pitch: 1, _pan: 0.5, _src: null, _gain: null, _pend: false, frameCount: 1, stream: {} };
  decodePath(path).then((b) => { s._buf = b; if (b) s.frameCount = b.length; if (s._pend && b) { s._pend = false; PlaySound(s); } });
  return s;
}
export function PlaySound(s: Snd) {
  if (!s) return;
  if (!s._buf) { s._pend = true; return; }
  const a = ctx();
  try { s._src?.stop(); } catch {}
  const src = a.createBufferSource(); src.buffer = s._buf; src.playbackRate.value = s._pitch;
  const g = a.createGain(); g.gain.value = s._vol;
  const pan = a.createStereoPanner(); pan.pan.value = (0.5 - s._pan) * 2;
  src.connect(g).connect(pan).connect(master!);
  src.start(); s._src = src; s._gain = g;
  src.onended = () => { if (s._src === src) s._src = null; };
}
export function StopSound(s: Snd) { try { s._src?.stop(); } catch {} s._src = null; s._pend = false; }
export function IsSoundPlaying(s: Snd) { return !!s && !!s._src; }
export function SetSoundVolume(s: Snd, v: number) { if (!s) return; s._vol = v; if (s._gain) s._gain.gain.value = v; }
export function SetSoundPitch(s: Snd, p: number) { if (s) s._pitch = p; }
export function SetSoundPan(s: Snd, p: number) { if (s) s._pan = p; }
export function UnloadSound(s: Snd) { StopSound(s); }
export function IsSoundReady(s: Snd) { return !!s; }

type Mus = { _path: string; _buf: AudioBuffer | null; _playing: boolean; _paused: boolean; _pos: number; _t0: number; _pitch: number; _vol: number; _src: AudioBufferSourceNode | null; _gain: GainNode | null; looping: boolean; frameCount: number; stream: any; ctxType: number };
const allMusic = new Set<Mus>();
function musNow(m: Mus) {
  if (!m._playing || !m._src || !AC) return m._pos;
  return m._pos + (AC.currentTime - m._t0) * m._pitch;
}
function musStart(m: Mus) {
  if (!m._buf) return;
  const a = ctx();
  musStop(m);
  if (m._pos >= m._buf.duration) m._pos = m.looping ? m._pos % m._buf.duration : m._buf.duration;
  const src = a.createBufferSource(); src.buffer = m._buf; src.playbackRate.value = m._pitch;
  const g = a.createGain(); g.gain.value = m._vol; src.connect(g).connect(master!);
  src.start(0, Math.max(0, m._pos));
  m._src = src; m._gain = g; m._t0 = a.currentTime;
}
function musStop(m: Mus) {
  if (m._src) { try { m._src.onended = null; m._src.stop(); } catch {} try { m._src.disconnect(); } catch {} m._src = null; }
}
function updateAudioClock() {
  for (const m of allMusic) {
    if (!m._playing || !m._buf || !m._src) continue;
    const t = musNow(m);
    if (t >= m._buf.duration) {
      if (m.looping) { m._pos = 0; musStart(m); }
      else { m._pos = 0; m._playing = false; musStop(m); }
    }
  }
}
export function LoadMusicStream(path: string): Mus {
  const m: Mus = { _path: path, _buf: null, _playing: false, _paused: false, _pos: 0, _t0: 0, _pitch: 1, _vol: 1, _src: null, _gain: null, looping: true, frameCount: 0, stream: { sampleRate: 44100, sampleSize: 32, channels: 2 }, ctxType: 0 };
  allMusic.add(m);
  decodePath(path).then((b) => {
    if (!b) return;
    m._buf = b; m.frameCount = b.length; m.stream.sampleRate = b.sampleRate;
    if (m._playing && !m._src) musStart(m);
  });
  return m;
}
export function IsMusicReady(m: Mus) { return !!m && !!m._buf; }
export function IsMusicValid(m: Mus) { return !!m; }
export function PlayMusicStream(m: Mus) {
  if (!m) return;
  resumeAudio();
  if (m._playing && m._src) { m._pos = 0; musStart(m); return; }
  if (!m._paused) m._pos = 0;
  m._playing = true; m._paused = false;
  musStart(m);
}
export function StopMusicStream(m: Mus) { if (!m) return; musStop(m); m._playing = false; m._paused = false; m._pos = 0; }
export function PauseMusicStream(m: Mus) { if (!m || !m._playing) return; m._pos = musNow(m); musStop(m); m._playing = false; m._paused = true; }
export function ResumeMusicStream(m: Mus) { if (!m || m._playing) return; m._playing = true; m._paused = false; musStart(m); }
export function SeekMusicStream(m: Mus, pos: number) {
  if (!m) return;
  m._pos = Math.max(0, pos);
  if (m._playing) musStart(m);
}
export function UpdateMusicStream() {}
export function IsMusicStreamPlaying(m: Mus) { return !!m && m._playing; }
export function SetMusicVolume(m: Mus, v: number) { if (!m) return; m._vol = v; if (m._gain) m._gain.gain.value = v; }
export function SetMusicPitch(m: Mus, p: number) {
  if (!m) return;
  if (m._src && AC) { m._pos = musNow(m); m._t0 = AC.currentTime; m._src.playbackRate.value = p; }
  m._pitch = p;
}
export function SetMusicPan() {}
export function GetMusicTimeLength(m: Mus) { return m && m._buf ? m._buf.duration : 0; }
export function GetMusicTimePlayed(m: Mus) {
  if (!m || !m._buf) return 0;
  const t = musNow(m);
  return m.looping ? t % m._buf.duration : Math.min(t, m._buf.duration);
}
export function UnloadMusicStream(m: Mus) { if (!m) return; musStop(m); m._playing = false; allMusic.delete(m); }
