"use client";

/**
 * Portal state. Two modes with one interface:
 *  - Demo (the preview, and any build without Supabase settings): data lives
 *    in this browser's localStorage, seeded with fictional sample data, and
 *    "signing in" just picks a sample person.
 *  - Live (LIVE in ./live/client): Supabase email + password sign-in, data
 *    loaded from the database, and every change written back (./live/sync).
 * Pages only ever call `update(d => next)`; they don't know which mode runs.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import type { Session } from "@supabase/supabase-js";
import { seed } from "./seed";
import type { Member, PortalData } from "./types";
import { LIVE, loginUrl, supabase } from "./live/client";
import { emptyData, loadAll } from "./live/load";
import { runSync } from "./live/sync";

const DATA_KEY = "gg-portal-data";
const VERSION_KEY = "gg-portal-version";
/**
 * Bump when the sample data's shape changes. Browsers holding an older shape
 * start over from the seed instead of crashing on missing fields.
 */
const DATA_VERSION = "11";
const SESSION_KEY = "gg-session";

/** Sign-in for live mode. Each call resolves to an error message for the person, or null. */
export type LiveAuth = {
  signIn: (email: string, password: string) => Promise<string | null>;
  /** Creates the account; Supabase then emails a link to confirm it. */
  signUp: (email: string, password: string) => Promise<{ error: string | null; confirm: boolean }>;
  sendReset: (email: string) => Promise<string | null>;
  setPassword: (password: string) => Promise<string | null>;
  /** The email the current session signed in with. */
  email?: string;
};

type Ctx = {
  data: PortalData;
  me?: Member;
  update: (fn: (d: PortalData) => PortalData) => void;
  reset: () => void;
  /** Demo only: sign in as a sample person. */
  signIn: (memberId: string) => void;
  signOut: () => void;
  ready: boolean;
  live: boolean;
  auth?: LiveAuth;
  /** Signed in, but the member hasn't finished the setup form yet. */
  needsSetup: boolean;
  /** Arrived from a password-reset link and needs to choose a new password. */
  recovering: boolean;
  /** The last thing that failed to save or load, for the banner. */
  error: string | null;
  dismissError: () => void;
};

const PortalContext = createContext<Ctx | null>(null);

/* ---------------------------------------------------------------- demo session */

const sessionListeners = new Set<() => void>();
const readSession = () => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch {
    return null;
  }
};
const subscribeSession = (cb: () => void) => {
  sessionListeners.add(cb);
  return () => sessionListeners.delete(cb);
};

export function useSessionId() {
  return useSyncExternalStore(subscribeSession, readSession, () => null);
}

export function setSession(id: string | null) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {}
  sessionListeners.forEach((l) => l());
}

function load(): PortalData {
  try {
    if (localStorage.getItem(VERSION_KEY) !== DATA_VERSION) {
      localStorage.removeItem(DATA_KEY);
      localStorage.setItem(VERSION_KEY, DATA_VERSION);
      return seed;
    }
    const raw = localStorage.getItem(DATA_KEY);
    if (raw) return { ...seed, ...(JSON.parse(raw) as PortalData) };
  } catch {}
  return seed;
}

function DemoProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<PortalData>(seed);
  const [ready, setReady] = useState(false);
  const sessionId = useSessionId();

  useEffect(() => {
    // Hydrate from the browser after mount so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setData(load());
    setReady(true);
  }, []);

  const update = useCallback((fn: (d: PortalData) => PortalData) => {
    setData((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(DATA_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      data,
      me: data.members.find((m) => m.id === sessionId),
      update,
      reset: () => {
        try {
          localStorage.removeItem(DATA_KEY);
        } catch {}
        setData(seed);
      },
      signIn: (id) => setSession(id),
      signOut: () => setSession(null),
      ready,
      live: false,
      needsSetup: false,
      recovering: false,
      error: null,
      dismissError: () => {},
    }),
    [data, sessionId, update, ready],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

/* ---------------------------------------------------------------- live */

const sameEmail = (a?: string, b?: string) => !!a && !!b && a.trim().toLowerCase() === b.trim().toLowerCase();

/** Supabase's messages, in the portal's words. */
function friendly(message: string) {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "That email and password don't match. Try again, or reset your password.";
  if (m.includes("email not confirmed")) return "Confirm your email first: open the link we sent when you set up your account.";
  if (m.includes("database error saving new user") || m.includes("not on the graphite roster"))
    return "That email isn't on the Graphite roster. Ask the executive board to add it in Members and roles.";
  if (m.includes("already registered")) return "This email already has an account. Sign in, or reset your password if you've forgotten it.";
  if (m.includes("rate limit") || m.includes("too many")) return "Too many tries for now. Wait a few minutes and try again.";
  if (m.includes("failed to fetch") || m.includes("network") || m.includes("load failed"))
    return "Couldn't reach the portal's server. Check your internet connection and try again.";
  if (m.includes("password")) return message;
  return message;
}

function LiveProvider({ children }: { children: ReactNode }) {
  const sb = supabase();
  const [session, setSession] = useState<Session | null>(null);
  const [checked, setChecked] = useState(false);
  const [data, setData] = useState<PortalData>(emptyData);
  const [loaded, setLoaded] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dataRef = useRef(data);
  const emailRef = useRef<string | undefined>(undefined);
  const queue = useRef<Promise<void>>(Promise.resolve());
  // Bumped on every local change, so a reload that started earlier doesn't overwrite newer edits.
  const version = useRef(0);
  const reloadTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastLoad = useRef(0);

  useEffect(() => {
    sb.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setChecked(true);
    });
    const { data: sub } = sb.auth.onAuthStateChange((event, s) => {
      if (event === "PASSWORD_RECOVERY") setRecovering(true);
      setSession(s);
      setChecked(true);
    });
    return () => sub.subscription.unsubscribe();
  }, [sb]);

  const reload = useCallback(async () => {
    const started = version.current;
    try {
      const fresh = await loadAll(sb);
      lastLoad.current = Date.now();
      if (version.current !== started) return; // a local edit landed meanwhile; its own reload follows
      dataRef.current = fresh;
      setData(fresh);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoaded(true);
    }
  }, [sb]);

  const email = session?.user.email;
  useEffect(() => {
    emailRef.current = email;
    if (!email) {
      dataRef.current = emptyData();
      setData(dataRef.current);
      setLoaded(false);
      return;
    }
    reload();
  }, [email, reload]);

  // Pick up other members' changes when someone comes back to the tab.
  useEffect(() => {
    const onFocus = () => {
      if (email && Date.now() - lastLoad.current > 60_000) reload();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [email, reload]);

  const memberFor = (members: Member[], e?: string) => (e ? members.find((m) => sameEmail(m.schoolEmail, e) || sameEmail(m.personalEmail, e)) : undefined);
  const me = memberFor(data.members, email);

  const scheduleReload = useCallback(() => {
    if (reloadTimer.current) clearTimeout(reloadTimer.current);
    reloadTimer.current = setTimeout(() => {
      queue.current = queue.current.then(() => reload());
    }, 1200);
  }, [reload]);

  const update = useCallback(
    (fn: (d: PortalData) => PortalData) => {
      const prev = dataRef.current;
      const next = fn(prev);
      if (next === prev) return;
      dataRef.current = next;
      version.current++;
      setData(next);
      const meId = memberFor(prev.members, emailRef.current)?.id;
      if (!meId) return;
      queue.current = queue.current
        .then(() => runSync(sb, meId, prev, next))
        .then(() => scheduleReload())
        .catch((e: unknown) => {
          setError(e instanceof Error ? e.message : String(e));
          // Put the screen back in line with what was actually saved.
          version.current++;
          return reload();
        });
    },
    [sb, reload, scheduleReload],
  );

  const auth = useMemo<LiveAuth>(
    () => ({
      email,
      signIn: async (e, p) => {
        const { error: err } = await sb.auth.signInWithPassword({ email: e.trim(), password: p });
        return err ? friendly(err.message) : null;
      },
      signUp: async (e, p) => {
        const { data: d, error: err } = await sb.auth.signUp({ email: e.trim(), password: p, options: { emailRedirectTo: loginUrl() } });
        if (err) return { error: friendly(err.message), confirm: false };
        return { error: null, confirm: !d.session };
      },
      sendReset: async (e) => {
        const { error: err } = await sb.auth.resetPasswordForEmail(e.trim(), { redirectTo: loginUrl() });
        return err ? friendly(err.message) : null;
      },
      setPassword: async (p) => {
        const { error: err } = await sb.auth.updateUser({ password: p });
        if (err) return friendly(err.message);
        setRecovering(false);
        return null;
      },
    }),
    [sb, email],
  );

  const value = useMemo<Ctx>(
    () => ({
      data,
      me,
      update,
      reset: () => {},
      signIn: () => {},
      signOut: () => {
        sb.auth.signOut();
      },
      // Ready once we know whether there's a session and, if so, the data has loaded.
      ready: checked && (!email || loaded),
      live: true,
      auth,
      needsSetup: !!me && !data.accounts[me.id],
      recovering,
      error,
      dismissError: () => setError(null),
    }),
    [data, me, update, sb, checked, email, loaded, auth, recovering, error],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
}

export function PortalProvider({ children }: { children: ReactNode }) {
  return LIVE ? <LiveProvider>{children}</LiveProvider> : <DemoProvider>{children}</DemoProvider>;
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) throw new Error("usePortal must be used inside PortalProvider");
  return ctx;
}

/** For pages that require a signed-in member. */
export function useMe() {
  const { me } = usePortal();
  if (!me) throw new Error("Not signed in");
  return me;
}
