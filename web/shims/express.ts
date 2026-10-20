// The desktop login opens a localhost callback server. Here that callback fires immediately with an error,
// so "Log in with Discord" fails cleanly instead of waiting forever.
const res: any = { status: () => res, send: () => res, json: () => res, end: () => res };
function express() {
  const app: any = {
    get(_p: string, handler: any) { setTimeout(() => handler({ query: { error: "offline", error_description: "Discord login isn't available in the web build" } }, res), 300); return app; },
    use() { return app; }, post() { return app; },
    listen(_p: any, cb?: any) { cb && setTimeout(cb, 0); return { close() {}, on() { return this; } }; },
  };
  return app;
}
(express as any).static = () => () => {};
(express as any).json = () => () => {};
export default express;
