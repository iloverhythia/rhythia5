import * as fs from "fs";
import * as path from "path";
import { DrawRing, Vector2 } from "raylib";
import { ConfigManager } from "../../../utils/configManager";
import { removeTextureFromCache } from "../../../utils/sprite";
import {
  BaseNoteRenderer,
  NoteRenderConfig,
  NoteRenderer,
  NoteRenderState,
} from "../atoms/NoteRenderer";
import { SpriteNoteRenderer } from "./spriteNoteRenderer";
import { BoxNoteRenderer } from "./boxNoteRenderer";
import { MeshNoteRenderer, NoteMesh } from "./meshNoteRenderer";

export interface NoteSkin {
  id: string;
  name: string;
  renderer: BaseNoteRenderer;
}

class CircleNoteRenderer extends BaseNoteRenderer {
  constructor(config: NoteRenderConfig) {
    super(config);
  }

  protected drawNote(state: NoteRenderState): void {
    this.applyTransform(state.position);
    DrawRing(Vector2(0, 0), state.size * 0.38, state.size / 2, 0, 360, 48, {
      ...state.color,
      a: Math.floor(state.alpha * 255),
    });
    this.removeTransform();
  }
}

const config: NoteRenderConfig = { squareScale: 1, noteMaxOpacity: 1 };

const builtinMeshes: NoteMesh[] = [
  { name: "better-standard-mesh", corners: 4, rounding: 20, fill: 100, depth: 0.24, bevel: 10 },
  { name: "cube", corners: 4, rounding: 0, fill: 12, depth: 1, bevel: 0 },
  { name: "rounded-frame", corners: 4, rounding: 40, fill: 24, depth: 0.12, bevel: 30 },
  { name: "hexagon", corners: 6, rounding: 10, fill: 30, depth: 0.2, bevel: 0 },
];

const builtinSkins: NoteSkin[] = [
  { id: "default", name: "default", renderer: new SpriteNoteRenderer(config) },
  { id: "box", name: "box", renderer: new BoxNoteRenderer(config) },
  { id: "dot", name: "dot", renderer: new SpriteNoteRenderer(config, "/circle.png") },
  { id: "circle", name: "circle", renderer: new CircleNoteRenderer(config) },
  ...builtinMeshes.map((mesh) => ({
    id: `mesh:${mesh.name}`,
    name: mesh.name,
    renderer: new MeshNoteRenderer(config, mesh),
  })),
];

const loadedSkins = new Map<string, NoteSkin>();
const skinFiles = new Map<string, string[]>();

export function skinDir(folder: string): string {
  const dir = path.join(ConfigManager.getAppDataDir(), folder);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

export function listSkinFiles(folder: string): string[] {
  if (!skinFiles.has(folder)) {
    const dir = skinDir(folder);
    skinFiles.set(
      folder,
      fs
        .readdirSync(dir)
        .filter((file: string) => file.toLowerCase().endsWith(".png"))
        .map((file: string) => path.join(dir, file))
    );
  }
  return skinFiles.get(folder)!;
}

export function addSkinFile(folder: string, picked: string): string {
  const target = path.join(skinDir(folder), path.basename(picked));
  fs.copyFileSync(picked, target);
  removeTextureFromCache(target);
  skinFiles.delete(folder);
  return target;
}

export function customNoteMeshes(): NoteMesh[] {
  return ConfigManager.getExtra<NoteMesh[]>("customNoteMeshes", []);
}

function loadedSkin(id: string, name: string, create: () => BaseNoteRenderer): NoteSkin {
  if (!loadedSkins.has(id)) loadedSkins.set(id, { id, name, renderer: create() });
  return loadedSkins.get(id)!;
}

export function noteSkins(): NoteSkin[] {
  return [
    ...builtinSkins,
    ...customNoteMeshes().map((mesh) =>
      loadedSkin(mesh.id!, mesh.name, () => new MeshNoteRenderer(config, mesh))
    ),
    ...listSkinFiles("noteskins").map((file) =>
      loadedSkin(file, path.basename(file, path.extname(file)), () =>
        new SpriteNoteRenderer(config, file, true)
      )
    ),
  ];
}

export function selectedNoteSkin(): NoteSkin {
  const id = ConfigManager.getExtra("noteSkin", "default");
  return noteSkins().find((skin) => skin.id === id) ?? builtinSkins[0];
}

export class SkinNoteRenderer implements NoteRenderer {
  private config: NoteRenderConfig;

  constructor(config: NoteRenderConfig) {
    this.config = { ...config };
  }

  public renderNote(...args: Parameters<NoteRenderer["renderNote"]>): void {
    const renderer = selectedNoteSkin().renderer;
    renderer.updateConfig(this.config);
    renderer.renderNote(...args);
  }

  public updateConfig(config: Partial<NoteRenderConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
