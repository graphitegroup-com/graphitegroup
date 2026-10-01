"use client";

import { usePathname } from "next/navigation";
import { STATIC_PREVIEW } from "./preview";

/**
 * The route path ("/portal/admin/website"), in both normal and static preview
 * builds. In the preview the browser URL is ".../portal-admin-website.html".
 */
export function usePagePath() {
  const pathname = usePathname();
  if (!STATIC_PREVIEW || !pathname.endsWith(".html")) return pathname;
  const file = pathname.split("/").pop()!.replace(/\.html$/, "");
  return file === "home" || file === "index" ? "/" : `/${file.replace(/-/g, "/")}`;
}
