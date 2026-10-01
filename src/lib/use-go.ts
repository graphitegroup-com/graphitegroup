"use client";

import { useRouter } from "next/navigation";
import { useCallback } from "react";
import { STATIC_PREVIEW, previewHref } from "./preview";

/** router.push / replace that also works in the static preview build. */
export function useGo() {
  const router = useRouter();
  return useCallback(
    (href: string, opts?: { replace?: boolean }) => {
      if (STATIC_PREVIEW) {
        if (opts?.replace) window.location.replace(previewHref(href));
        else window.location.assign(previewHref(href));
        return;
      }
      if (opts?.replace) router.replace(href);
      else router.push(href);
    },
    [router],
  );
}
