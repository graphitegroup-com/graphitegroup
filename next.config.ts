import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep links to the old Webflow pages working after the domain moves.
  async redirects() {
    return [
      { source: "/for-students", destination: "/students", permanent: true },
      { source: "/apply", destination: "/students#apply", permanent: true },
      { source: "/for-clients", destination: "/work", permanent: true },
      { source: "/about-us", destination: "/", permanent: true },
      { source: "/our-team", destination: "/team", permanent: true },
      { source: "/our-work-strategy", destination: "/work#strategy", permanent: true },
      { source: "/our-work-digital", destination: "/work#digital", permanent: true },
    ];
  },
};

export default nextConfig;
