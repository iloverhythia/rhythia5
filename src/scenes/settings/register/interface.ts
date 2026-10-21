import { registerSettings } from "../../../utils/settingsRegistry";

registerSettings("interfaceSettings", [
  ...[
    ["hudLeftBackground", "Background"],
    ["hudCombo", "Combo"],
    ["hudAccuracy", "Accuracy"],
    ["hudMisses", "Misses"],
    ["hudRightBackground", "Background"],
    ["hudScore", "Score"],
    ["hudRank", "Rank"],
    ["hudNotesLeft", "Notes Left"],
    ["hudMapTitle", "Map Title"],
    ["hudTime", "Time"],
    ["hudProgressBar", "Progress Bar"],
    ["hudHealthBar", "Health Bar"],
    ["hudModeIndicator", "Mode Indicator"],
    ["hudSkipPrompt", "Skip Prompt"],
  ].map(([key, label]) => ({ key, label, defaultValue: 1, min: 0, max: 1, step: 1 })),
  { key: "failVignetteOpacity", label: "Fail Vignette Opacity", defaultValue: 0.5, min: 0, max: 1, step: 0.01 },
]);
