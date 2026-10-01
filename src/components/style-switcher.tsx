"use client";

import { useSyncExternalStore } from "react";

const STYLES = [
  { id: "classic", label: "Classic" },
  { id: "modern", label: "Modern" },
] as const;
type StyleId = (typeof STYLES)[number]["id"];

const listeners = new Set<() => void>();

function getStyle(): StyleId {
  return document.documentElement.dataset.style === "modern" ? "modern" : "classic";
}

function applyStyle(id: StyleId) {
  document.documentElement.dataset.style = id;
  try {
    localStorage.setItem("gg-style", id);
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/**
 * Lets reviewers flip between the two public styles. Remove this component
 * (and the boot script in app/layout.tsx) once a style is chosen.
 */
export function StyleSwitcher() {
  const style = useSyncExternalStore(subscribe, getStyle, () => "classic" as StyleId);

  return (
    <div className="fixed right-4 bottom-4 z-[60] flex items-center gap-1 border border-line bg-white p-1 text-xs shadow-[0_6px_24px_rgba(0,0,0,0.12)]">
      <span className="px-2 font-semibold text-slate">Style</span>
      {STYLES.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => applyStyle(s.id)}
          aria-pressed={style === s.id}
          className={`px-3 py-1.5 font-semibold transition-colors ${
            style === s.id ? "bg-ink text-white" : "text-ink hover:bg-cloud"
          }`}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}
