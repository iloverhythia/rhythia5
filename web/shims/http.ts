export function createServer() { return { listen(_p: any, cb?: any) { cb && setTimeout(cb, 0); return this; }, close() {}, on() { return this; } }; }
export default { createServer };
