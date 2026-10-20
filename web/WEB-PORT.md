# Rhythia web port

Runs the unmodified TypeScript client (`src/`, `index.ts`) in the browser. Nothing in `src/` is edited; the
build swaps native modules for browser versions:

| Module | Web version (`shims/`) |
|---|---|
| raylib (node-raylib) | `raylib.ts` — WebGL2 rlgl-style batcher (CPU matrix stack, perspective camera, scissor, mipmapped textures), canvas glyph atlases sized from each TTF's hhea metrics like stb_truetype, input with GLFW key codes, Web Audio Music/Sound (looping, pitch, seek) |
| fs, fs/promises | `fs.ts` over `vfs.ts` — in-memory FS; `public/` fetched at boot (large audio lazily), writes persist to IndexedDB |
| nativefiledialog | browser file pickers; the build adds `await` before `openDialog(`/`openFolderDialog(` calls |
| sharp | OffscreenCanvas resize/blur/raw/png |
| steamworks.js, @supabase/supabase-js, rhythia-api, express, http | offline stand-ins (Discord login fails with a message, online lists fail like being offline) |
| simplevideo | throws, so video backgrounds are off |
| timers/promises `setImmediate` | resolves on requestAnimationFrame, which drives the existing `while (true)` loop |

Boot (`boot.ts`) preloads assets, registers fonts, waits for a click (autoplay policy), seeds
`config.json` with `passedInit: true, selectedTab: "Downloaded"` on first run (the tutorial's map step needs
the API), then imports `index.ts`. Dropping `.sspm` files on the window calls `Maps.importBuffer`.

Build (from the repo root): `npm i --no-save esbuild@0.25.9 restructure buffer events path-browserify`, then `node web/build.mjs`.
It writes `index.html`, `boot.js`, `chunk-*.js` and `manifest.json` to the root, which GitHub Pages serves from the `gh-pages` branch.

