// Builds a static, server-free copy of the site into ./preview-dist for viewing
// without Vercel (for example as a shared artifact). Every page becomes a
// top-level .html file and all paths are relative, so it works from any folder.
//
//   npm run build:preview            whole site plus portal, entry is the hub page
//   npm run build:preview -- --portal portal only, entry goes straight to sign-in
//                                     (the default while the public pages are switched off)
//
// Differences from production: no contact-form endpoint, no redirects, and the
// portal runs on sample data saved in the browser.
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const api = path.join(root, "src/app/api");
const apiOff = path.join(root, "src/app/_api_off");
const out = path.join(root, ".next-preview"); // with distDir set, `output: "export"` writes here
const dist = path.join(root, "preview-dist");
// Portal only when asked, or whenever the public pages are switched off (src/app/(site) absent).
const portalOnly = process.argv.includes("--portal") || !fs.existsSync(path.join(root, "src/app/(site)"));

// Route types left by `next dev` still name the API route hidden below and fail the
// build's type check. They are regenerated the next time the dev server starts.
fs.rmSync(path.join(root, ".next/dev/types"), { recursive: true, force: true });

// API routes can't be statically exported; a leading underscore makes the folder private.
if (fs.existsSync(api)) fs.renameSync(api, apiOff);
try {
  execSync("npx next build", {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, STATIC_PREVIEW: "1", NEXT_PUBLIC_STATIC_PREVIEW: "1" },
  });
} finally {
  if (fs.existsSync(apiOff)) fs.renameSync(apiOff, api);
}

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist);

const walk = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));

for (const file of walk(out)) {
  const rel = path.relative(out, file);
  if (rel.endsWith(".txt")) continue; // RSC payloads, unused with full page loads
  let target = rel;
  if (rel.endsWith(".html")) {
    // portal/admin/website.html -> portal-admin-website.html; index.html -> home.html
    target = rel === "index.html" ? "home.html" : rel.replace(/\//g, "-");
    if (target === "404.html" || target === "_not-found.html") continue;
    if (portalOnly && !/^(portal|login)/.test(target)) continue;
    let html = fs.readFileSync(file, "utf8");
    html = html.replace(/(["'(])\/(images|brand)\//g, "$1$2/").replace(/(["'])\/icon\.svg/g, "$1icon.svg");
    fs.writeFileSync(path.join(dist, target), html);
    continue;
  }
  fs.mkdirSync(path.dirname(path.join(dist, target)), { recursive: true });
  if (rel.endsWith(".css")) {
    // Font files are referenced relative to the site root; make them relative to the CSS file.
    let css = fs.readFileSync(file, "utf8");
    css = css.replace(/url\((["']?)(?:\.)?\/_next\/static\/media\//g, "url($1../media/");
    fs.writeFileSync(path.join(dist, target), css);
  } else {
    fs.copyFileSync(file, path.join(dist, target));
  }
}

// Some hosts (including artifact hosting) reserve names starting with "_",
// so the _next folder becomes "assets" and every reference follows.
fs.renameSync(path.join(dist, "_next"), path.join(dist, "assets"));
for (const file of walk(dist)) {
  if (!/\.(html|js|css)$/.test(file)) continue;
  let text = fs.readFileSync(file, "utf8");
  const before = text;
  text = text.replaceAll("_next/", "assets/");
  // Some uploaders reject a literal U+FFFD; the JS escape is equivalent inside strings and regexes.
  if (file.endsWith(".js")) text = text.replaceAll("\uFFFD", "\\uFFFD");
  if (text !== before) fs.writeFileSync(file, text);
}

// Entry point (index.html): the hub page, or a hop straight to sign-in.
if (portalOnly) {
  fs.writeFileSync(
    path.join(dist, "index.html"),
    `<meta charset="utf-8" /><title>Graphite Group Portal</title><script>location.replace("login.html")</script><a href="login.html">Open the member portal</a>\n`,
  );
} else {
  fs.copyFileSync(path.join(root, "scripts/preview-hub.html"), path.join(dist, "index.html"));
}

console.log(`\nPreview written to ${path.relative(root, dist)}/ (${walk(dist).length} files)`);
