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
      // Keep links to the old Webflow pages working after the domain moves.
      async redirects() {
        return [
          { source: "/for-students", destination: "/students", permanent: true },
          { source: "/apply", destination: "/students#recruiting", permanent: true },
          { source: "/for-clients", destination: "/clients", permanent: true },
          { source: "/about-us", destination: "/about", permanent: true },
          { source: "/members", destination: "/login", permanent: false },
          { source: "/our-team", destination: "/people", permanent: true },
          { source: "/team", destination: "/people", permanent: true },
          { source: "/services", destination: "/clients", permanent: true },
          { source: "/our-work-strategy", destination: "/clients#strategy", permanent: true },
          { source: "/our-work-digital", destination: "/clients#digital", permanent: true },
        ];
      },
    };

export default nextConfig;
