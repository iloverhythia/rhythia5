const result = { data: null, error: { message: "Online features are not available in the web build" } };
const chain: any = new Proxy(function () {}, {
  get: (_t, k) => (k === "then" ? (res: any) => Promise.resolve(result).then(res) : chain),
  apply: () => chain,
});
export function createClient() {
  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      setSession: async () => ({ data: { session: null }, error: null }),
      refreshSession: async () => ({ data: { session: null }, error: null }),
      signInWithOAuth: async () => ({ data: { url: "about:blank", provider: "discord" }, error: null }),
      exchangeCodeForSession: async () => ({ data: { session: null }, error: { message: "offline" } }),
      signOut: async () => ({ error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    },
    from: () => chain,
    rpc: () => chain,
    channel: () => ({ on() { return this; }, subscribe() { return this; }, unsubscribe() {}, send: async () => "ok", track: async () => "ok", presenceState: () => ({}) }),
    removeChannel() {},
    storage: { from: () => chain },
  };
}
export type SupabaseClient = any; export type Session = any; export type User = any;
