import { registerSettings } from "../../../utils/settingsRegistry";

registerSettings("gameplaySettings", [
  { key: "gridParallax", label: "Grid Parallax", defaultValue: 1, min: -10, max: 25, step: 0.1 },
  { key: "cameraFov", label: "Camera FOV", defaultValue: 74, min: 30, max: 180, step: 1 },
  { key: "spinCamera", label: "Spin Camera", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "halfGhost", label: "Half Ghost", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "deathSlowdown", label: "Death Slowdown", defaultValue: 1, min: 0, max: 1, step: 1 },
] as const);
