import type { Metadata } from "next";
import { AboutPageView } from "@/components/pages/about";

export const metadata: Metadata = {
  title: "About",
  description: "Founded in 2018, Graphite Group is the student consulting group of the Claremont Colleges.",
};

export default function AboutPage() {
  return <AboutPageView />;
}
