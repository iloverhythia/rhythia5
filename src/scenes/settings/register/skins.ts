import { registerSettings } from "../../../utils/settingsRegistry";

registerSettings("skinsSettings", [
  { key: "noteSpinX", label: "Note Spin Pitch", defaultValue: 0, min: -360, max: 360, step: 1 },
  { key: "noteSpinY", label: "Note Spin Yaw", defaultValue: 0, min: -360, max: 360, step: 1 },
  { key: "noteSpinZ", label: "Note Spin Roll", defaultValue: 0, min: -360, max: 360, step: 1 },
  { key: "halfGhostStrength", label: "Half Ghost Strength", defaultValue: 0.8, min: 0.1, max: 1, step: 0.05 },
  { key: "noteSpawnEffect", label: "Note Spawn Effect", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "approachSquares", label: "Approach Squares", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "approachFollow", label: "Approach Follow", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "hitEffectAtCursor", label: "Hit Effect at Cursor", defaultValue: 1, min: 0, max: 1, step: 1 },
  { key: "scorePopup", label: "Score Popup", defaultValue: 0, min: 0, max: 1, step: 1 },
  { key: "billboardScore", label: "Billboard Popup", defaultValue: 0, min: 0, max: 1, step: 1 },
] as const);
