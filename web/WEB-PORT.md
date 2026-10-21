# Rhythia web port

Runs the unmodified TypeScript client (`src/`, `index.ts`) in the browser. Nothing in `src/` is edited; the
build swaps native modules for browser versions:

| Module | Web version (`shims/`) |
|---|---|
| raylib (node-raylib) | `raylib.ts` — WebGL2 rlgl-style batcher (CPU matrix stack, perspective camera, scissor, mipmapped textures), canvas glyph atlases sized from each TTF's hhea metrics like stb_truetype, input with GLFW key codes, Web Audio Music/Sound (looping, pitch, seek) |
| fs, fs/promises | `fs.ts` over `vfs.ts` — in-memory FS; `public/` fetched at boot (large audio lazily), writes persist to IndexedDB |
| nativefiledialog | browser file pickers; the build adds `await` before `openDialog(`/`openFolderDialog(` calls |
| sharp | OffscreenCanvas resize/blur/raw/png |
| rhythia-api | `rhythia-api.ts`, generated from the package's endpoint list: same POST to `https://<env>.rhythia.com/api/*`, same profanity censor (the API sends `Access-Control-Allow-Origin: *`) |
| `src/utils/auth/supabase.ts` | `overrides/auth-supabase.ts`: real supabase-js, same exports; Discord login redirects to Supabase and back to the page instead of a localhost callback server |
| steamworks.js, express, http | stand-ins (no Steam: cloud config off, lobbies report that they need Steam) |
| simplevideo | throws, so video backgrounds are off |
| timers/promises `setImmediate` | resolves on requestAnimationFrame, which drives the existing `while (true)` loop |

Boot (`boot.ts`) preloads assets, registers fonts, waits for a click (autoplay policy), then imports `index.ts`. Dropping `.sspm` files on the window calls `Maps.importBuffer`.

Build (from the repo root): `npm i --no-save esbuild@0.25.9 restructure buffer events path-browserify`, then `node web/build.mjs`.
It writes `index.html`, `boot.js`, `chunk-*.js` and `manifest.json` to the root, which GitHub Pages serves from the `gh-pages` branch.


Setup needed on the Supabase project: add the Pages URL (`https://iloverhythia.github.io/rhythia5/`) to Auth → URL Configuration → Redirect URLs, otherwise Discord login returns to the Site URL instead.
Map files and online covers are fetched from `static.rhythia.com`; that host must allow cross-origin GETs for downloads to work in the browser.
