// The game's main loop awaits setImmediate() between frames; in the browser that means the next animation frame.
export const setImmediate = (v?: any) => new Promise((res) => requestAnimationFrame(() => res(v)));
export const setTimeout = (ms: number, v?: any) => new Promise((res) => globalThis.setTimeout(() => res(v), ms));
export default { setImmediate, setTimeout };
