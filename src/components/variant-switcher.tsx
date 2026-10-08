"use client";

import { useState, useSyncExternalStore } from "react";
import { VARIANTS, type VariantId } from "@/lib/variants";

const listeners = new Set<() => void>();
const getVariant = () => (document.documentElement.dataset.variant as VariantId) ?? "original";
const subscribe = (cb: () => void) => {
  listeners.add(cb);
  return () => listeners.delete(cb);
};
function applyVariant(id: VariantId) {
  document.documentElement.dataset.variant = id;
  try {
    localStorage.setItem("gg-variant", id);
  } catch {}
  listeners.forEach((l) => l());
}

/** Review tool for comparing design variants. Remove once a variant is chosen. */
export function VariantSwitcher() {
  const variant = useSyncExternalStore(subscribe, getVariant, () => "original" as VariantId);
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed right-4 bottom-4 z-[60] text-[13px] tracking-normal">
      {open ? (
        <div className="w-60 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-[0_10px_40px_rgba(0,0,0,0.15)]">
          <div className="flex items-center justify-between px-4 pt-3 pb-2">
            <span className="font-semibold">Design variant</span>
            <button type="button" onClick={() => setOpen(false)} className="text-text hover:text-ink" aria-label="Hide variant switcher">
              Hide
            </button>
          </div>
          <ul className="px-2 pb-2">
            {VARIANTS.map((v) => (
              <li key={v.id}>
                <button
                  type="button"
                  onClick={() => applyVariant(v.id)}
                  aria-pressed={variant === v.id}
                  className={`w-full rounded-xl px-3 py-2 text-left transition-colors ${variant === v.id ? "bg-ink text-white" : "hover:bg-gray"}`}
                >
                  <span className="block font-medium">{v.label}</span>
                  <span className={`block text-xs ${variant === v.id ? "text-white/70" : "text-text"}`}>{v.note}</span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <button type="button" onClick={() => setOpen(true)} className="rounded-full bg-ink px-4 py-2.5 font-medium text-white shadow-lg">
          Variant: {VARIANTS.find((v) => v.id === variant)?.label}
        </button>
      )}
    </div>
  );
}
