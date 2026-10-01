import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep links to the old Webflow pages working after the domain moves.
  async redirects() {
    return [
      { source: "/for-students", destination: "/students", permanent: true },
      { source: "/apply", destination: "/students#recruiting", permanent: true },
      { source: "/for-clients", destination: "/services", permanent: true },
      { source: "/about-us", destination: "/about", permanent: true },
      { source: "/our-team", destination: "/team", permanent: true },
      { source: "/our-work-strategy", destination: "/services#strategy", permanent: true },
      { source: "/our-work-digital", destination: "/services#digital", permanent: true },
    ];
  },
};

export default nextConfig;
