/**
 * Static preview build (scripts/build-preview.mjs) for viewing the site as a
 * set of plain HTML files, e.g. a shared artifact, before Vercel is set up.
 * In that build every page is a top-level file and navigation is a full page
 * load, so internal paths are rewritten here. Normal builds are unaffected.
 */

export const STATIC_PREVIEW = process.env.NEXT_PUBLIC_STATIC_PREVIEW === "1";

/** "/portal/admin/website#x" -> "portal-admin-website.html#x"; "/" -> "home.html". */
export function previewHref(href: string) {
  if (!href.startsWith("/")) return href;
  const [path, hash] = href.split("#");
  const clean = path.replace(/^\/+|\/+$/g, "");
  // Detail pages share one exported file per type; the id travels in the query string.
  const detail = clean.match(/^portal\/(companies|network|projects)\/([^/]+)$/);
  if (detail) return `portal-${detail[1]}-item.html?id=${detail[2]}${hash ? `#${hash}` : ""}`;
  const file = clean ? `${clean.replace(/\//g, "-")}.html` : "home.html";
  return hash ? `${file}#${hash}` : file;
}

export function resolveHref(href: string) {
  return STATIC_PREVIEW ? previewHref(href) : href;
}

/** Ids exported for each detail route. The preview build exports a single "item" page per type. */
export function detailParams<K extends string>(key: K, ids: string[]): Record<K, string>[] {
  return (STATIC_PREVIEW ? ["item"] : ids).map((id) => ({ [key]: id }) as Record<K, string>);
}
