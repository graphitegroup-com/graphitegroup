"use client";

import { useParams, useSearchParams } from "next/navigation";
import { STATIC_PREVIEW } from "./preview";

/** A dynamic route segment; in the static preview build it comes from `?id=` instead. */
export function useRouteParam(name: string) {
  const params = useParams<Record<string, string>>();
  const search = useSearchParams();
  const raw = STATIC_PREVIEW ? search.get("id") ?? "" : params[name] ?? "";
  return decodeURIComponent(raw);
}
