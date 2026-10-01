"use client";

import { useSyncExternalStore } from "react";
import { defaultSiteContent, type SiteContent } from "./site-content";

const KEY = "gg-site-content";
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: SiteContent } = { raw: null, value: defaultSiteContent };

function read(): SiteContent {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {
    return defaultSiteContent;
  }
  if (raw === cache.raw) return cache.value;
  let value = defaultSiteContent;
  if (raw) {
    try {
      value = { ...defaultSiteContent, ...(JSON.parse(raw) as Partial<SiteContent>) };
    } catch {
      value = defaultSiteContent;
    }
  }
  cache = { raw, value };
  return value;
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => e.key === KEY && cb();
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

/** Live site content: defaults plus anything exec has edited in the portal. */
export function useSiteContent(): SiteContent {
  return useSyncExternalStore(subscribe, read, () => defaultSiteContent);
}

export function saveSiteContent(next: SiteContent) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...next, updatedAt: new Date().toISOString() }));
  } catch (e) {
    throw new Error(e instanceof Error && e.name === "QuotaExceededError" ? "Storage is full. Use smaller photos." : "Could not save.");
  }
  listeners.forEach((l) => l());
}

export function resetSiteContent() {
  try {
    localStorage.removeItem(KEY);
  } catch {}
  listeners.forEach((l) => l());
}
