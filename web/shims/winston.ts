const fmt: any = new Proxy(function () { return {}; }, { get: () => fmt, apply: () => ({}) });
class T { constructor(_: any) {} }
const winston: any = {
  createLogger: () => ({ info: (...a: any[]) => console.log(...a), warn: (...a: any[]) => console.warn(...a), error: (...a: any[]) => console.error(...a), debug() {}, log: (...a: any[]) => console.log(...a) }),
  transports: { Console: T, File: T },
  format: fmt,
};
export default winston;
