// Web version of src/utils/auth/supabase.ts: same exports, browser redirect login instead of a localhost callback server.
import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";
import { ProfileManager } from "../../src/utils/profileManager";

const SUPABASE_SESSION_FIELD = "supabaseSession" as const;
const SUPABASE_AUTH_PORT = 9001;
const SUPABASE_AUTH_PATH = "/login";
const SUPABASE_REDIRECT_URL = window.location.origin + window.location.pathname;
const SUPABASE_URL = "https://pfkajngbllcbdzoylrvp.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBma2FqbmdibGxjYmR6b3lscnZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjkwMTUzMDUsImV4cCI6MjA0NDU5MTMwNX0.9j9lpQ-k8Qtp-s5jslGdxQe8cAvuLXIeB-DgfRMOFbc";

const supabaseClient: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { detectSessionInUrl: true, persistSession: true, flowType: "implicit" },
});

let profileLoaded = false;
let activeSessionRefresh: Promise<User | null> | null = null;

function ensureProfileLoaded(): void {
  if (!profileLoaded) {
    ProfileManager.load();
    profileLoaded = true;
  }
}

function getCachedSupabaseSession(): unknown | null {
  ensureProfileLoaded();
  const profile = ProfileManager.peek();
  return (profile as any)[SUPABASE_SESSION_FIELD] ?? null;
}

function setCachedSupabaseSession(session: unknown): void {
  ensureProfileLoaded();
  const accessToken =
    typeof session === "object" && session !== null
      ? ((session as any).access_token as string | undefined)
      : undefined;

  ProfileManager.update({
    supabaseSession: session,
    token: accessToken,
  });
  ProfileManager.save();
}

function clearCachedSupabaseSession(): void {
  ensureProfileLoaded();
  ProfileManager.update({ supabaseSession: undefined, token: undefined });
  ProfileManager.save();
}

const HASH_REDIRECT_SCRIPT = `
 <script>
   const hash = window.location.hash;
   if (hash.length > 0 && hash.startsWith('#')) {
     window.location.replace(window.location.href.replace('#', '?'));
   }
 </script>
`;

export function openExternalUrl(url: string): void {
  window.open(url, "_blank", "noopener");
}

async function tryRestoreCachedSession(): Promise<User | null> {
  const cachedSession = getCachedSupabaseSession();
  if (!cachedSession) return null;

  try {
    const session = await supabaseClient.auth.setSession(cachedSession as any);

    if (!session.error) {
      if (session.data.session) {
        setCachedSupabaseSession(session.data.session);
      }
      return session.data.user ?? null;
    }
  } catch (error) {
    clearCachedSupabaseSession();
    return null;
  }

  clearCachedSupabaseSession();
  return null;
}

export async function refreshCachedSession(): Promise<User | null> {
  if (!activeSessionRefresh) {
    activeSessionRefresh = (async () => {
      try {
        return await tryRestoreCachedSession();
      } finally {
        activeSessionRefresh = null;
      }
    })();
  }

  return activeSessionRefresh;
}

ProfileManager.registerGetHook(() => {
  const profile = ProfileManager.peek();
  const hasSession = Boolean((profile as any)[SUPABASE_SESSION_FIELD]);
  const hasToken = Boolean(profile.token);

  if (!hasSession || hasToken) {
    return;
  }

  return refreshCachedSession()
    .then(() => undefined)
    .catch((error) => {
      console.error("Failed to refresh cached Supabase session:", error);
    });
});

export async function loginWithDiscord(
  cacheOnly?: boolean
): Promise<User | null> {
  // Browser flow: Supabase redirects back to this page and supabase-js picks the session out of the URL.
  const current = await supabaseClient.auth.getSession();
  if (current.data.session) {
    setCachedSupabaseSession(current.data.session);
    clearAuthParamsFromUrl();
    return current.data.session.user ?? null;
  }
  const cachedUser = await tryRestoreCachedSession();
  if (cachedUser) return cachedUser;
  if (cacheOnly) return new Promise<User | null>(() => {});

  const { data, error } = await supabaseClient.auth.signInWithOAuth({
    provider: "discord",
    options: { redirectTo: SUPABASE_REDIRECT_URL, skipBrowserRedirect: true },
  });
  if (error) throw error;
  if (!data?.url) throw new Error("Supabase did not return a redirect URL.");
  try { (await import("../shims/vfs")).vfs.flush(); } catch {}
  await new Promise((r) => setTimeout(r, 400));
  window.location.assign(data.url);
  return new Promise<User | null>(() => {});
}

function clearAuthParamsFromUrl(): void {
  try {
    const u = new URL(window.location.href);
    if (u.hash.includes("access_token") || u.searchParams.has("code")) {
      u.hash = "";
      u.searchParams.delete("code");
      history.replaceState(null, "", u.toString());
    }
  } catch {}
}

export async function loginGuest(): Promise<User | null> {
  const result = await supabaseClient.auth.signInWithPassword({
    email: "sample@hook.ac",
    password: "password",
  });

  if (result.error) {
    throw result.error;
  }

  return result.data.user ?? null;
}

export const SUPABASE_CONSTANTS = {
  SESSION_FIELD: SUPABASE_SESSION_FIELD,
  REDIRECT_URL: SUPABASE_REDIRECT_URL,
  PORT: SUPABASE_AUTH_PORT,
  PATH: SUPABASE_AUTH_PATH,
  URL: SUPABASE_URL,
  ANON_KEY: SUPABASE_ANON_KEY,
};

export { supabaseClient };

export async function getJwt(): Promise<string> {
  const session = await supabaseClient.auth.getSession();

  if (session.data.session) {
    setCachedSupabaseSession(session.data.session);
    return session.data.session.access_token || "";
  }

  clearCachedSupabaseSession();
  return "";
}
