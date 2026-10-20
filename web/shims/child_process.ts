export function exec(cmd: string, cb?: any) { if (typeof cb === "function") setTimeout(() => cb(null, "", ""), 0); return { on() { return this; }, kill() {} }; }
export function spawn() { return { on() { return this; }, stdout: { on() {} }, stderr: { on() {} }, kill() {}, unref() {} }; }
export function execSync() { return ""; }
export default { exec, spawn, execSync };
