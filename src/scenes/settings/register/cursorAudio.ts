import { registerSettings } from "../../../utils/settingsRegistry";

registerSettings("cursorAudioSettings", [
  { key: "cursorColorRed", label: "Cursor Red", defaultValue: 255, min: 0, max: 255, step: 1 },
  { key: "cursorColorGreen", label: "Cursor Green", defaultValue: 255, min: 0, max: 255, step: 1 },
  { key: "cursorColorBlue", label: "Cursor Blue", defaultValue: 255, min: 0, max: 255, step: 1 },
  { key: "cursorRotation", label: "Cursor rotation", defaultValue: 0, min: -10, max: 10, step: 0.01 },
  { key: "cursorTrailEnabled", label: "Cursor Trail", defaultValue: 1, min: 0, max: 1, step: 1 },
  { key: "missParticleEnabled", label: "Miss Effect", defaultValue: 1, min: 0, max: 1, step: 1 },
] as const);
