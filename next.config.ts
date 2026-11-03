import type { NextConfig } from "next";

// `npm run build:preview` makes a static, server-free copy for previews (see scripts/build-preview.mjs).
const preview = process.env.STATIC_PREVIEW === "1";

const nextConfig: NextConfig = preview
  ? {
      output: "export",
      distDir: ".next-preview",
      assetPrefix: ".",
      images: { loader: "custom", loaderFile: "./src/lib/preview-image-loader.ts" },
    }
  : {
      // Members-only for now: the public site stays on WordPress, so "/" opens the portal.
      // The old Webflow redirects live in git history for when the public pages move here.
      async redirects() {
        return [
          { source: "/", destination: "/portal", permanent: false },
          { source: "/members", destination: "/login", permanent: false },
        ];
      },
    };

export default nextConfig;
