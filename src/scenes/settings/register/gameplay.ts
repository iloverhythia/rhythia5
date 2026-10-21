import { registerSettings } from "../../../utils/settingsRegistry";

registerSettings("gameplaySettings", [
  { key: "gridParallax", label: "Grid Parallax", defaultValue: 1, min: -25, max: 25, step: 0.1 },
  { key: "cameraFov", label: "Field of View", defaultValue: 74, min: 30, max: 179, step: 1 },
  { key: "spinCamera", label: "Spin Camera", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "halfGhost", label: "Half Ghost", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "deathSlowdown", label: "Death Slowdown", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "disablePausing", label: "Disable Pausing", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "customSpeed", label: "Custom Speed Rate", defaultValue: 100, min: 5, max: 1000, step: 0.01 },
  { key: "hitboxSize", label: "Hitbox Size", defaultValue: 1.14, min: 0, max: 8, step: 0.001 },
  { key: "hitWindow", label: "Hit Window", defaultValue: 55, min: 0, max: 1000, step: 1 },
  { key: "leadInTime", label: "Lead-In Time", defaultValue: 3000, min: 500, max: 10000, step: 100 },
  { key: "counterSpeed", label: "Counter Speed", defaultValue: 1, min: 0, max: 1, step: 1 },
  { key: "restartOnDeath", label: "Restart on Death", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "absoluteScale", label: "Absolute Scale", defaultValue: 1, min: 0, max: 100, step: 0.01 },
  { key: "farawayHud", label: "Faraway Hud", defaultValue: 1, min: 0, max: 1, step: 1 },
  { key: "bufferCursor", label: "Buffer Cursor", defaultValue: 1, min: 0, max: 1, step: 1 },
  { key: "followBufferCursor", label: "Follow Buffer Cursor", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "hitFov", label: "Hit FOV", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "hitFovMode", label: "Hit FOV Mode", defaultValue: 1, min: 0, max: 3, step: 1 },
  { key: "hitFovAmplifier", label: "Hit FOV Amplifier", defaultValue: 2, min: 1, max: 100, step: 0.01 },
  { key: "hitFovDecay", label: "Hit FOV Decay", defaultValue: 20, min: 1, max: 100, step: 0.01 },
] as const);
