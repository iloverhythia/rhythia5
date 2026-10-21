import * as fs from "fs";
import {
  Color,
  DrawLine3D,
  DrawTriangle3D,
  Vector3,
  rlPopMatrix,
  rlPushMatrix,
  rlRotatef,
  rlScalef,
  rlTranslatef,
  rlDisableBackfaceCulling,
  rlEnableBackfaceCulling,
} from "raylib";
import {
  BaseNoteRenderer,
  NoteRenderConfig,
  NoteRenderState,
} from "../atoms/NoteRenderer";

export interface NoteMesh {
  id?: string;
  name: string;
  corners: number;
  rounding: number;
  fill: number;
  depth: number;
  bevel: number;
  bulge?: number;
}

type Triangle = { a: Vector3; b: Vector3; c: Vector3; shade: number };

const DEPTH_SCALE = 0.32;
const OUTLINE_COLOR = { r: 0, g: 230, b: 255, a: 255 };
const LIGHT = { x: -0.3 / 1.118, y: -0.4 / 1.118, z: -1 / 1.118 };
const meshCache = new Map<string, Triangle[]>();

function lightOf(a: Vector3, b: Vector3, c: Vector3) {
  const u = { x: b.x - a.x, y: b.y - a.y, z: b.z - a.z };
  const v = { x: c.x - a.x, y: c.y - a.y, z: c.z - a.z };
  const n = { x: u.y * v.z - u.z * v.y, y: u.z * v.x - u.x * v.z, z: u.x * v.y - u.y * v.x };
  const length = Math.hypot(n.x, n.y, n.z);
  return { n, length, light: (n.x * LIGHT.x + n.y * LIGHT.y + n.z * LIGHT.z) / length };
}

const shadeOf = (light: number) => Math.min(1, Math.max(0.2, 0.25 + 0.85 * light));

function loadObj(file: string): Triangle[] {
  const verts: Vector3[] = [];
  const faces: Vector3[][] = [];
  fs.readFileSync(file, "utf8")
    .split(/\r?\n/)
    .forEach((line: string) => {
      const [cmd, ...args] = line.trim().split(/\s+/);
      if (cmd === "v") verts.push(Vector3(+args[0], -Number(args[1]), -Number(args[2])));
      if (cmd === "f") faces.push(args.map((arg) => verts[parseInt(arg) < 0 ? verts.length + parseInt(arg) : parseInt(arg) - 1]));
    });
  const extent = 2 * verts.reduce((max, p) => Math.max(max, Math.abs(p.x), Math.abs(p.y)), 0) || 1;
  const fit = (p: Vector3) => Vector3(p.x / extent, p.y / extent, p.z / extent);
  return faces.flatMap((face) =>
    face.slice(2).map((p, i) => {
      const [a, b, c] = [face[0], face[i + 1], p].map(fit);
      return { a, b, c, shade: shadeOf(Math.abs(lightOf(a, b, c).light) || 0) };
    })
  );
}

function buildOutline(corners: number, rounding: number): { x: number; y: number }[] {
  const offset = -Math.PI / 2 + (corners % 2 === 0 ? Math.PI / corners : 0);
  const raw = Array.from({ length: corners }, (_, i) => {
    const angle = offset + (Math.PI * 2 * i) / corners;
    return { x: Math.cos(angle), y: Math.sin(angle) };
  });
  const t = (rounding / 100) * 0.5;
  const segments = Math.ceil(16 / corners);
  const points = t <= 0
    ? raw
    : raw.flatMap((p, i) => {
        const prev = raw[(i + corners - 1) % corners];
        const next = raw[(i + 1) % corners];
        const a = { x: p.x + (prev.x - p.x) * t, y: p.y + (prev.y - p.y) * t };
        const b = { x: p.x + (next.x - p.x) * t, y: p.y + (next.y - p.y) * t };
        return Array.from({ length: segments + 1 }, (_, s) => {
          const u = s / segments;
          const w0 = (1 - u) * (1 - u);
          const w1 = 2 * u * (1 - u);
          const w2 = u * u;
          return { x: a.x * w0 + p.x * w1 + b.x * w2, y: a.y * w0 + p.y * w1 + b.y * w2 };
        });
      });
  const extent = Math.max(...points.map((p) => Math.max(Math.abs(p.x), Math.abs(p.y))));
  return points.map((p) => ({ x: (p.x / extent) * 0.5, y: (p.y / extent) * 0.5 }));
}

function buildMesh(mesh: NoteMesh): Triangle[] {
  const outline = buildOutline(Math.round(mesh.corners), mesh.rounding);
  const count = outline.length;
  const half = mesh.depth / 2;
  const bevel = mesh.bevel / 100;
  const inset = 1 - bevel * 0.2;
  const bevelDepth = half * bevel;
  const ring = (scale: number, z: number) =>
    outline.map((p) => Vector3(p.x * scale, p.y * scale, z));
  const front = ring(inset, -half);
  const frontEdge = ring(1, -half + bevelDepth);
  const backEdge = ring(1, half - bevelDepth);
  const back = ring(inset, half);
  const hollow = mesh.fill < 100;
  const innerScale = inset * (1 - mesh.fill / 100);
  const innerFront = hollow ? ring(innerScale, -half) : null;
  const innerBack = hollow ? ring(innerScale, half) : null;

  const triangles: Triangle[] = [];
  const add = (a: Vector3, b: Vector3, c: Vector3, inward = false) => {
    const { n, length, light } = lightOf(a, b, c);
    if (length < 1e-9) return;
    const cx = a.x + b.x + c.x;
    const cy = a.y + b.y + c.y;
    const cz = a.z + b.z + c.z;
    const facing = inward ? -(cx * n.x + cy * n.y) : cx * n.x + cy * n.y + cz * n.z;
    const sign = facing < 0 ? -1 : 1;
    triangles.push({
      a,
      b: sign < 0 ? c : b,
      c: sign < 0 ? b : c,
      shade: shadeOf(sign * light),
    });
  };
  const strip = (from: Vector3[], to: Vector3[], inward = false) =>
    from.forEach((p, i) => {
      const j = (i + 1) % count;
      add(p, from[j], to[j], inward);
      add(p, to[j], to[i], inward);
    });
  const bulge = ((mesh.bulge ?? 0) / 100) * 0.175;
  const cap = (outer: Vector3[], inner: Vector3[] | null, z: number) => {
    if (inner) return strip(outer, inner);
    const top = z + Math.sign(z) * bulge;
    const rings = bulge > 0 ? [0.75, 0.5, 0.25].map((s) => outer.map((p) => Vector3(p.x * s, p.y * s, z + (top - z) * (1 - s * s)))) : [];
    const last = [outer, ...rings].reduce((from, to) => (strip(from, to), to));
    last.forEach((p, i) => add(Vector3(0, 0, top), p, last[(i + 1) % count]));
  };

  cap(back, innerBack, half);
  if (innerFront && innerBack) strip(innerFront, innerBack, true);
  strip(back, backEdge);
  strip(backEdge, frontEdge);
  strip(frontEdge, front);
  cap(front, innerFront, -half);
  return triangles;
}

export function drawMesh(
  mesh: NoteMesh | string,
  position: Vector3,
  size: number,
  color: Color,
  rotation: { x: number; y: number } = { x: 0, y: 0 },
  outline: boolean = false
): void {
  const key = typeof mesh === "string" ? mesh : [mesh.corners, mesh.rounding, mesh.fill, mesh.depth, mesh.bevel, mesh.bulge].join("|");
  if (!meshCache.has(key)) {
    if (meshCache.size > 64) meshCache.clear();
    meshCache.set(key, typeof mesh === "string" ? loadObj(mesh) : buildMesh(mesh));
  }

  rlPushMatrix();
  rlTranslatef(position.x, position.y, position.z);
  rlScalef(1, 1, DEPTH_SCALE);
  rlRotatef(rotation.x, 1, 0, 0);
  rlRotatef(rotation.y, 0, 1, 0);
  rlScalef(size, size, size);
  if (typeof mesh === "string") rlDisableBackfaceCulling();
  const triangles = meshCache.get(key)!;
  triangles.forEach((t) =>
    DrawTriangle3D(t.a, t.b, t.c, {
      r: Math.round(color.r * t.shade),
      g: Math.round(color.g * t.shade),
      b: Math.round(color.b * t.shade),
      a: color.a,
    })
  );
  if (outline) {
    triangles.forEach((t) => {
      DrawLine3D(t.a, t.b, OUTLINE_COLOR);
      DrawLine3D(t.b, t.c, OUTLINE_COLOR);
      DrawLine3D(t.c, t.a, OUTLINE_COLOR);
    });
  }
  if (typeof mesh === "string") rlEnableBackfaceCulling();
  rlPopMatrix();
}

export class MeshNoteRenderer extends BaseNoteRenderer {
  constructor(config: NoteRenderConfig, private mesh: NoteMesh | string) {
    super(config);
  }

  protected drawNote(state: NoteRenderState): void {
    drawMesh(this.mesh, state.position, state.size, {
      ...state.color,
      a: Math.floor(state.alpha * 255),
    });
  }
}
