"use client";

/**
 * Portal state for the preview build. Data lives in the browser
 * (localStorage), seeded with sample data. The production version swaps these
 * functions for Supabase queries with the same shapes (see docs/PORTAL.md).
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from "react";
import { seed } from "./seed";
import type { Member, PortalData } from "./types";

const DATA_KEY = "gg-portal-data";
const VERSION_KEY = "gg-portal-version";
/**
 * Bump when the sample data's shape changes. Browsers holding an older shape
 * start over from the seed instead of crashing on missing fields.
 */
const DATA_VERSION = "6";
const SESSION_KEY = "gg-session";

type Ctx = {
  data: PortalData;
  me?: Member;
  update: (fn: (d: PortalData) => PortalData) => void;
  reset: () => void;
  signIn: (memberId: string) => void;
  signOut: () => void;
  ready: boolean;
};

const PortalContext = createContext<Ctx | null>(null);

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

export function PortalProvider({ children }: { children: ReactNode }) {
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
    }),
    [data, sessionId, update, ready],
  );

  return <PortalContext.Provider value={value}>{children}</PortalContext.Provider>;
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
